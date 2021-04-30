import { ChangeDetectorRef, Component, TemplateRef, ViewChild } from '@angular/core';
import { Router, ActivatedRoute, ParamMap } from '@angular/router';
import { DialogService } from 'src/app/dialog/services/dialog.service';
import { DialogFactoryService } from 'src/app/dialog/services/dialog-factory.service';
import { Observable, Subject } from 'rxjs';
import { AgGridAngular } from 'ag-grid-angular';
import { TemplateRenderer } from 'src/app/components/cellRenderers/template.renderer';
import { RefsetService } from 'src/app/services/rest/refset.service';
import { Title } from '@angular/platform-browser';
import { Refset } from 'src/app/models/refset';
import { CodeUtility } from 'src/app/utilities/code.utility';
import { UiUtility } from 'src/app/utilities/ui.utility';
import { BreadcrumbService } from 'src/app/services/breadcrumb.service';
import { PaginationComponent } from 'src/app/components/pagination/pagination.component';
import { TreeOptions } from 'src/app/models/tree-options.model';
import { TreeNode } from '@circlon/angular-tree-component';


/**
 * @title Tree with nested nodes
 */
@Component({
    selector: 'app-refset-details',
    templateUrl: 'refset-details.html'
})

export class RefsetDetails {

    id: string;
    refsetId: string = '';
    refsetLoaded = new Subject<boolean>();
    refsetLoaded$ = this.refsetLoaded.asObservable()
    searchInput: string;
    versionOptions = [{ value: '3', display: 'Published (2021-01-15)' }, { value: '2', display: 'In Development' }, { value: '1', display: 'Beta (2020-11-23)' }];
    selectedVersion: string = '3';
    languageOptions = [{ value: '900000000000509007PT', display: 'EN (PT)' }];
    defaultLanguage: string;
    selectedLanguage: string[] = ['900000000000509007PT', '900000000000509007FSN'];
    membersGridChooserManualStateRefresh =  new Boolean(true);
    useDialog: boolean = false;
    selectedMemebersListMode: string = 'table'; //taxonomy
    membersGridApi: any;
    membersGridColumnApi: any;
    membersColumnDefs = [];
    membersGridOptions: any;
    membersGridPaging = {
        pageSize: 10,
        pageSizeOptions: [10, 25, 50, 100],
        totalKnown: false,
        totalRows: null,
        manualStateRefresh: new Boolean(true)
    };
    membersGridLastFilter: string = '';
    membersGridLastSort: string = '';
    showTable: boolean;
    refsetData: any;
    membersGridData: any;
    membersTreeData: any;
    dialog: DialogService;
    conceptDetail: any = null;
    conceptDescriptions: any = [];
    membersTaxonomyNodes: any[] = [];
    membersTaxonomyOptions: TreeOptions = {getChildren: this.getTaxonomyChildren};

    @ViewChild('detailsActionSection') actionSection: TemplateRef<any>;
    @ViewChild('detailsRichTextDialog') richTextDialog: TemplateRef<any>;
    @ViewChild('detailsMembersPaging') membersPaginationComponent: PaginationComponent;


    constructor(
        private route: ActivatedRoute,
        private router: Router,
        private titleService: Title,
        private dialogFactoryService: DialogFactoryService,
        private refsetService: RefsetService,
        private changeDetectorRef: ChangeDetectorRef,
        private breadcrumbService: BreadcrumbService
    ) {
        refsetService.getTaxonomyRoot();
    }

    //***** Framework Functions *****/
    ngOnInit() {

        this.id = this.route.snapshot.paramMap.get('refsetId');
        
        this.breadcrumbService.setBreadcrumbs([{path: '/directory', label: 'Directory'}, {label: 'Refset Details'}]);

        this.refsetLoaded$.subscribe(loaded => {

            this.membersGridOptions = {
                context: { componentParent: this },
                pagination: true,
                onGridSizeChanged: UiUtility.resizeGridColumns,
                suppressColumnVirtualisation: true, // need this so you can access rows and cells that might not be currently visible, including if the grid is hidden
                suppressPaginationPanel: true,
                paginationPageSize: this.membersGridPaging.pageSize,
                cacheBlockSize: this.membersGridPaging.pageSize,
                maxBlocksInCache: 1,
                loadingCellRenderer: 'agLoadingOverlay',
                rowModelType: 'infinite',
                rowSelection: 'single',
                onCellClicked: this.onMembersGridCellClick,
                onGridReady: this.onMembersGridReady,
                onNewColumnsLoaded: this.onMembersColumnsLoaded.bind(this),
                frameworkComponents: {
                    'templateRenderer': TemplateRenderer
                },
                defaultColDef: {
                    sortable: true,
                    resizable: true,
                    filter: true,
                    floatingFilter: true,
                    floatingFilterComponentParams: { placeholder: 'Warehouses', suppressFilterButton: true },
                    suppressMenu: true
                }
            };
    
            this.showTable = true
            this.changeDetectorRef.detectChanges();

            // taxonomy loading
            let root = this.refsetService.getTaxonomyRoot();
            this.loadTaxonomyTree(root);
        });

        this.refsetService.getRefset(this.id).subscribe(results => {

            this.refsetId = results?.refsetId;
            this.refsetData = results;
            this.titleService.setTitle('Refset Tool - Refset Details: ' + this.refsetId);
            let languages = this.refsetData?.edition?.fullyQualifiedLanguageRefsets;
            let languageRefsetOptions = []
            this.refsetData.versionDate = CodeUtility.formatJsonDate(this.refsetData?.versionDate);

            for (let language of languages) {

                if (CodeUtility.testBoolean(language.default)) {
                    this.defaultLanguage = language.qualifiedLanguageRefset;
                }

                languageRefsetOptions.push({ value: language.qualifiedLanguageRefset, display: language.qualifiedLanguageCode });
            }

            if (languageRefsetOptions.length > 0){
                this.languageOptions = languageRefsetOptions
            }

            if (CodeUtility.hasValue(this.refsetData)) {

                this.shortenNoteFields();

            } else {

                console.log('Error loading refset details data.');
            }

            this.refsetLoaded.next(true);
        });
    }

    ngAfterViewInit() {
    }

    //***** Members Taxonomy Functions  *****/
    loadTaxonomyTree(startingConcept, depth: number = 1){

        let restParams = {
            displayType: 'taxonomy',
            depth: depth,
            startingConceptId: startingConcept.code
        };

        this.refsetService.getMembersList(this.id, restParams).subscribe(results => {

            startingConcept.children = results.items;
            this.membersTaxonomyNodes = [startingConcept];
        });
    }

    getTaxonomyChildren(node: TreeNode) {

        let restParams = {
            displayType: 'taxonomy',
            depth: 1,
            startingConceptId: node.data.code
        };

        return this.refsetService.getMembersList(this.id, restParams);
      }

    //***** Members Grid Functions *****/
    onMembersGridReady = (gridReadyParams) => {

        this.membersGridApi = gridReadyParams.api;
        this.membersGridColumnApi = gridReadyParams.columnApi;
        //let refsetLanguages = [{languageId: 'EN (PT)', languageName: 'EN (PT)'}, {languageId: 'EN (FSN)', languageName: 'EN (FSN)'}];

        let dataSource = {
            rowCount: null,
            getRows: (rowParams) => {

                this.membersGridApi.showLoadingOverlay();

                let pageNumber = rowParams.endRow / this.membersGridApi.paginationGetPageSize();
                let query = UiUtility.formatFilterData(rowParams.filterModel);
                let sort = UiUtility.formatSortData(rowParams.sortModel);

                //query = CodeUtility.addIfNotEmpty(query, ' AND ') + this.searchInput;

                let newFilterString = query;
                let newSortString = JSON.stringify(sort);

                // if the filters or sort have changed then move to the first page
                if (newFilterString !== this.membersGridLastFilter || newSortString !== this.membersGridLastSort) {

                    pageNumber = 1;
                    this.membersGridApi?.api?.paginationGoToPage(0);
                }

                // if the filters have changed then reset the total row variables
                if (newFilterString !== this.membersGridLastFilter){

                    this.membersGridPaging.totalRows = null;
                    this.membersGridPaging.totalKnown = false;
                }

                this.membersGridLastFilter = newFilterString;
                this.membersGridLastSort = newSortString;

                let restParams = {
                    query: query,
                    sortModel: rowParams.sortModel,
                    limit: this.membersGridApi.paginationGetPageSize(),
                    offset: pageNumber - 1
                }

                this.refsetService.getMembersList(this.id, restParams).subscribe(results => {

                    if (results.items.length == 0 && pageNumber > 1) {

                        this.membersGridPaging.totalRows = (this.membersGridApi.paginationGetPageSize() * (pageNumber - 1));
                        this.membersGridPaging.totalKnown = true;
                        this.membersPaginationComponent.goToPage(pageNumber - 1);
                        return;
                    }

                    let data = results.items;
                    this.membersGridData = data;

                    this.membersColumnDefs = [
                        { field: 'code', headerName: 'Concept ID', cellClass: 'refset-tool-details-column-concept-id' }
                    ];

                    for (let i = 0; i < this.languageOptions.length; i++) {

                        let language = this.languageOptions[i];
                        this.membersColumnDefs.push({ field: i.toString(), colId: language.value, headerName: language.display, cellClass: 'refset-tool-details-column-description', valueGetter: this.descriptionValueGetter });
                    }

                    this.membersColumnDefs.push(...[
                        { field: 'memberEffectiveTime', colId: 'modified', headerName: 'Modified Date', cellClass: 'refset-tool-details-column-modified-date', valueGetter: UiUtility.gridDateValueGetter },
                        { field: 'memberStatus', colId: 'actions', headerName: '', width: 120, cellClass: 'refset-tool-details-column-actions', cellRenderer: 'templateRenderer', cellRendererParams: { template: this.actionSection }, filter: false }
                    ]);

                    if (data.length > 0) {

                        this.membersGridApi.hideOverlay();
                        let currentRowCount = null;
                        let lastRow = -1;

                        if (results.totalKnown || data.length < this.membersGridApi.paginationGetPageSize() || this.membersGridPaging.totalKnown) {

                            if (results.totalKnown) {

                                lastRow = results.totalResults;

                            } else if (this.membersGridPaging.totalKnown) {

                                lastRow = this.membersGridPaging.totalRows;
                            } else {

                                currentRowCount = data.length + ((pageNumber - 1) * this.membersGridApi.paginationGetPageSize());
                                lastRow = currentRowCount;
                            }

                            this.membersGridPaging.totalRows = lastRow;
                            this.membersGridPaging.totalKnown = true;

                        } else {
                            currentRowCount = data.length + ((pageNumber - 1) * this.membersGridApi.paginationGetPageSize());
                        }
                        
                        rowParams.successCallback(data, lastRow);
                    } else {

                        this.membersGridApi.showNoRowsOverlay();
                        rowParams.successCallback(data, 0);
                    }

                    this.membersGridPaging.manualStateRefresh = new Boolean(true);
                },
                error => {
                    
                    this.membersGridApi.showNoRowsOverlay();
                    rowParams.successCallback([], 0);
                });
            }
        };

        gridReadyParams.api.setDatasource(dataSource);

        // set placeholders on the grid floating filter fields
        Array.from(document.querySelectorAll('.ag-floating-filter-full-body .ag-input-field-input')).forEach((obj: any) => {

            if (obj.attributes['disabled']) { // skip columns with disabled filter
                return;
            }

            let label = obj.getAttribute('aria-label');
            let value = label.substring(0, label.indexOf('Filter Input')) + '...';
            obj.setAttribute('placeholder', value);
        });

    }

    onMembersColumnsLoaded() {
        this.membersGridChooserManualStateRefresh = new Boolean(true);
    }

    descriptionValueGetter = function (params) {
        return params?.data?.descriptions[params.colDef.field]?.term;
    };

    onMembersGridCellClick = (event) => {

        if (event.column.colId === 'actions') {


        } else {

            let selectedRows = this.membersGridApi.getSelectedRows();
            let selectedId: string;
            console.log(selectedRows);

            selectedRows.forEach(function (selectedRow, index) {
                selectedId = selectedRow.code;
                console.log('Selected Row: ' + selectedId);
            });

            this.conceptDetail = this.getMemberRow(selectedId);
            this.conceptDescriptions = this.conceptDetail.descriptions.filter(function (description) {
                return description != null;
            });

            // TODO: Take this out when we get parents/children working on backend
            const conceptParents = [];
            const conceptChildren = [];

            for (let i = 1; i < 6; i++){
                conceptParents.push(
                    {name: 'Parent ' + i, type: ''}
                );
            }

            for (let i = 1; i < 6; i++){
                conceptChildren.push(
                    {name: 'Child ' + i, type: ''}
                );
            }

            this.conceptDetail.parents = conceptParents;
            this.conceptDetail.children = conceptChildren;

            //this.router.navigate(['/details', selectedId]);
        }
    }

    //***** General Functions *****/

    shortenNoteFields(){

        if (CodeUtility.hasValue(this.refsetData)){

            if (CodeUtility.hasValue(this.refsetData.narrative)){
                this.refsetData.narrativeShortText = CodeUtility.textOverflow(CodeUtility.stripHtml(this.refsetData.narrative), 25);
            }

            if (CodeUtility.hasValue(this.refsetData.versionNotes)){
                this.refsetData.versionNotesShortText = CodeUtility.textOverflow(CodeUtility.stripHtml(this.refsetData.versionNotes), 25);
            }
        }
    }

    //***** General Functions *****/
    getMemberRow(memberId: string) {

        let concept;

        for (let i = 0; i < this.membersGridData.length; i++) {

            if (this.membersGridData[i].code == memberId) {

                concept = this.membersGridData[i];
                break;
            }
        }

        return concept;
    }

    closeConceptDetails() {
        this.conceptDetail = null;
    }

    onTmcChange($event){

    }

    openRichTextEditor(fieldName, displayName = fieldName) {

        const dialogId = 'detailsRichTextDialog';

        const dialogData = {
            headerText: `Refset ${displayName} for ${this.refsetData.name} (${this.refsetData.id})`,
            template: this.richTextDialog,
            data: {fieldName: fieldName, text: this.refsetData[fieldName]}
        }

        const dialogOptions = {
            id: dialogId,
            width: '750px'
        }

        this.dialog = this.dialogFactoryService.open(dialogData, dialogOptions);

        this.dialog.confirmed().subscribe(data => {

            if (data) {

                this.refsetData[fieldName] = data.text;
                this.shortenNoteFields();
            }
        });
    }

    changeVersion() {

    }

    openAuditTrail() {

    }

    openArtifacts() {

    }

    changeLanguage() {

    }

    openMemberFeedback() {

    }

    openMemberHistory() {

    }

    clearSearch() {

        if (this.searchInput != '') {

            this.searchInput = '';
            this.onSearchChange();
        }
    }

    onSearchChange() {
        this.membersGridApi.purgeInfiniteCache();
    }
}