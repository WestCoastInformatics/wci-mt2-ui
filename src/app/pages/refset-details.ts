import { ChangeDetectorRef, Component, TemplateRef, ViewChild } from '@angular/core';
import { Router, ActivatedRoute, ParamMap } from '@angular/router';
import { DialogService } from 'src/app/dialog/services/dialog.service';
import { DialogFactoryService } from 'src/app/dialog/services/dialog-factory.service';
import { TemplateRenderer } from 'src/app/components/cellRenderers/template.renderer';
import { RefsetService } from 'src/app/services/rest/refset.service';
import { Title } from '@angular/platform-browser';
import { CodeUtility } from 'src/app/utilities/code.utility';
import { Debounce } from 'src/app/decorators/debounce.decorator';
import { UiUtility } from 'src/app/utilities/ui.utility';
import { BreadcrumbService } from 'src/app/services/breadcrumb.service';
import { PaginationComponent } from 'src/app/components/pagination/pagination.component';
import { TreeOptions } from 'src/app/models/tree-options.model';
import { RefsetUtility } from 'src/app/utilities/refset.utility';
import { Subject, forkJoin } from 'rxjs';
import { tap } from 'rxjs/operators';
import { TaxonomyTreeComponent } from 'src/app/components/taxonomy-tree/taxonomy-tree.component';

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
    refsetLoaded$ = this.refsetLoaded.asObservable();
    memberCacheLoaded = new Subject<boolean>();
    memberCacheLoaded$ = this.refsetLoaded.asObservable();
    tableSearchInput: string;
    versionOptions: any;
    selectedVersion: string;
    languageOptions = [{ value: '900000000000509007PT', display: 'EN (PT)' }];
    defaultLanguage: string;
    selectedLanguage: string[] = ['900000000000509007PT', '900000000000509007FSN'];
    selectedTaxonomyLanguage: string = '900000000000509007PT';
    selectedTaxonomyLanguageIndex: number = 0;
    membersGridChooserManualStateRefresh =  new Boolean(true);
    useDialog: boolean = false;
    selectedMembersListMode: string = 'table'; //taxonomy
    membersTableDisplay: string = 'block';
    membersTaxonomyDisplay: string = 'none';
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
    isConceptDetailsLoading: boolean = false;
    membersTaxonomyRoot: any[] = [];
    taxonomyManualStateRefresh: Boolean = new Boolean(false);
    taxonomyOptions: TreeOptions = {
        onSelect: this.onTaxonomySelected.bind(this),
        displayField: '0'
    };
    taxonomyButtonLabel = 'Loading...';
    taxonomySearchInput: string;
    taxonomySearchResults: any[] = [];
    showTaxonomySearchTable: boolean = false;
    taxonomySearchDisplay: string = 'none';
    taxonomySearchGridApi: any;
    taxonomySearchGridColumnApi: any;
    taxonomySearchColumnDefs = [];
    taxonomySearchGridOptions: any;
    taxonomySearchGridPaging = {
        pageSize: 10,
        pageSizeOptions: [10, 25, 50, 100],
        totalKnown: false,
        totalRows: null,
        manualStateRefresh: new Boolean(true)
    };
    taxonomySearchGridLastFilter: string = '';
    taxonomySearchGridLastSort: string = '';


    @ViewChild('detailsActionSection') actionSection: TemplateRef<any>;
    @ViewChild('detailsRichTextDialog') richTextDialog: TemplateRef<any>;
    @ViewChild('detailsMembersPaging') membersPaginationComponent: PaginationComponent;
    @ViewChild('refsetFeedbackDialog') refsetFeedbackDialog: TemplateRef<any>;
    @ViewChild('refsetAuditDialog') refsetAuditDialog: TemplateRef<any>;
    @ViewChild('refsetArtifactsDialog') refsetArtifactsDialog: TemplateRef<any>;
    @ViewChild('memberHistoryDialog') memberHistoryDialog: TemplateRef<any>;
    @ViewChild('memberFeedbackDialog') memberFeedbackDialog: TemplateRef<any>;
    @ViewChild('detailsMembersTaxonomy') taxonomyMembersComponent: TaxonomyTreeComponent;
    @ViewChild('taxonomySearchPaginationComponent') taxonomySearchPaginationComponent: PaginationComponent;
    @ViewChild('taxonomyResultSection') taxonomyResultSection: TemplateRef<any>;
    @ViewChild('taxonomyPathSection') taxonomyPathSection: TemplateRef<any>;
    showFullNarrativeText = false;
    showFullNotesText = false;


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

        // var allObservables = [this.refsetLoaded$, this.memberCacheLoaded$].map((obs, i) => obs.pipe(tap({
        //     next(value) { console.log(`Observable ${i} emits: ${value}`); },
        //     complete() { console.log(`Observable ${i} is complete`); }
        // })));

        var allObservables = {
            refsetLoaded: this.refsetLoaded$, 
            memberCacheLoaded: this.memberCacheLoaded
        };
        
        this.refsetLoaded$.subscribe(loaded => {

            this.membersGridOptions = {
                context: { componentParent: this },
                pagination: true,
                suppressColumnVirtualisation: true, // need this so you can access rows and cells that might not be currently visible, including if the grid is hidden
                suppressPaginationPanel: true,
                paginationPageSize: this.membersGridPaging.pageSize,
                cacheBlockSize: this.membersGridPaging.pageSize,
                maxBlocksInCache: 1,
                rowModelType: 'infinite',
                rowSelection: 'single',
                enableCellTextSelection: true,
                onCellClicked: this.onMembersGridCellClick,
                onGridReady: this.onMembersGridReady,
                onNewColumnsLoaded: this.onMembersColumnsLoaded.bind(this),
                frameworkComponents: {
                    'templateRenderer': TemplateRenderer
                },
                defaultColDef: {
                    sortable: true,
                    resizable: true,
                    suppressMenu: true
                },
                rowClassRules: {
                    'refset_tool_grid_inactive_row': function(params) {
        
                        var inactivatedRow = false;
        
                        if (params.data){
                            inactivatedRow = params.data.active == false;
                        }
        
                        return inactivatedRow;
                    }
                }
            };

            this.showTable = true
        });
    
        // call forkJoin on returned observables
        forkJoin(allObservables).subscribe(({refsetLoaded, memberCacheLoaded}) => {

            console.log('refsetLoaded: ' + refsetLoaded);
            console.log('memberCacheLoaded: ' + memberCacheLoaded);
            
            // load taxonomy root
            this.refsetService.getMembersDetails('138875005', {refsetInternalId: this.refsetData.id}).subscribe(results => {

                this.membersTaxonomyRoot = results;
                this.taxonomyButtonLabel = "Taxonomy";
                this.showTaxonomySearchTable = true
            });

            this.taxonomySearchColumnDefs = [
                { field: 'name', colId: 'result', headerName: 'Result', cellClass: 'refset-tool-directory-column-edition', valueGetter: this.taxonomyResultValueGetter.bind(this), cellRenderer: 'templateRenderer', cellRendererParams: { template: this.taxonomyResultSection } },
                { field: 'parents', colId: 'path', headerName: 'Path', cellClass: 'refset-tool-directory-column-edition', valueGetter: this.taxonomyPathValueGetter.bind(this), cellRenderer: 'templateRenderer', cellRendererParams: { template: this.taxonomyPathSection } },
            ];

            this.taxonomySearchGridOptions = {
                context: { componentParent: this },
                pagination: true,
                suppressColumnVirtualisation: true, // need this so you can access rows and cells that might not be currently visible, including if the grid is hidden
                suppressPaginationPanel: true,
                paginationPageSize: this.taxonomySearchGridPaging.pageSize,
                cacheBlockSize: this.taxonomySearchGridPaging.pageSize,
                maxBlocksInCache: 1,
                rowModelType: 'infinite',
                rowSelection: 'single',
                onCellClicked: this.onTaxonomySearchGridCellClick,
                onGridReady: this.onTaxonomySearchGridReady,
                frameworkComponents: {
                    'templateRenderer': TemplateRenderer
                },
                defaultColDef: {
                    sortable: true,
                    resizable: true,
                    suppressMenu: true,
                    floatingFilter: false,
                    filter: false,
                },
                rowClassRules: {
                    'refset_tool_grid_inactive_row': function(params) {
        
                        var inactivatedRow = false;
        
                        if (params.data){
                            inactivatedRow = params.data.active == false;
                        }
        
                        return inactivatedRow;
                    }
                }
            };
            
        });

        this.refsetService.getRefset(this.id).subscribe(results => {

            this.refsetId = results?.refsetId;
            this.refsetData = results;
            this.refsetData.status = RefsetUtility.getStatus(this.refsetData.active);
            this.titleService.setTitle('Refset Tool - Refset Details: ' + this.refsetId);
            let languages = this.refsetData?.edition?.fullyQualifiedLanguageRefsets;
            let languageRefsetOptions = [];
            this.refsetData.versionDate = CodeUtility.formatJsonDate(this.refsetData?.versionDate, CodeUtility.DATE_FORMAT_REVERSE);
            this.versionOptions = RefsetUtility.getVersionOptions(this.refsetData);
            this.selectedVersion = this.id;
            this.refsetData.flagIcon = RefsetUtility.getEditionFlagIcon(this.refsetData.edition.branch);

            for (let language of languages) {

                if (CodeUtility.testBoolean(language.default)) {

                    this.defaultLanguage = language.qualifiedLanguageRefset;
                    this.selectedTaxonomyLanguage = language.qualifiedLanguageRefset;
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
            this.refsetLoaded.complete();
        });

        this.refsetService.cacheMemberAncestors(this.id).subscribe(results => {

            let success = results?.success;

            if (CodeUtility.testBoolean(success)) {

            } else {
                console.log('Error caching refset member details.');
            }

            this.memberCacheLoaded.next(true);
            this.memberCacheLoaded.complete();
        });
    }

    //***** Members Taxonomy Functions  *****/
    onTaxonomySelected(event) {
        
        let selectedConcept = CodeUtility.clone(event.node.data);
        this.loadConceptDetail(selectedConcept);
    }

    changeTaxonomyLanguage(){

        this.selectedTaxonomyLanguageIndex = this.languageOptions.findIndex(option => option.value === this.selectedTaxonomyLanguage);
        this.taxonomyOptions.displayField = this.selectedTaxonomyLanguageIndex + '';
        this.taxonomyManualStateRefresh = new Boolean("true"); 
        this.taxonomySearchGridApi.refreshCells();
    }

    onTaxonomySearchGridReady = (gridReadyParams) => {

        this.taxonomySearchGridApi = gridReadyParams.api;
        this.taxonomySearchGridColumnApi = gridReadyParams.columnApi;

        let dataSource = {
            rowCount: null,
            getRows: (rowParams) => {

                if (!CodeUtility.hasValue(this.taxonomySearchInput)) {

                    this.taxonomySearchGridApi.showNoRowsOverlay();
                    rowParams.successCallback([], 0);
                    return;
                }

                this.taxonomySearchGridApi.showLoadingOverlay();

                let pageNumber = rowParams.endRow / this.taxonomySearchGridApi.paginationGetPageSize();
                let query = '';
                let sort = UiUtility.formatSortData(rowParams.sortModel);

                if (CodeUtility.hasValue(this.taxonomySearchInput) && this.taxonomySearchInput.length > 2){
                    query = CodeUtility.addIfNotEmpty(query, ' AND ') + this.taxonomySearchInput;
                }

                let newFilterString = query;
                let newSortString = JSON.stringify(sort);

                // if the filters or sort have changed then move to the first page
                if (newFilterString !== this.taxonomySearchGridLastFilter || newSortString !== this.taxonomySearchGridLastSort) {

                    pageNumber = 1;
                    this.taxonomySearchGridApi.api?.paginationGoToPage(0);
                }

                // if the filters have changed then reset the total row variables
                if (newFilterString !== this.taxonomySearchGridLastFilter){

                    this.taxonomySearchGridPaging.totalRows = null;
                    this.taxonomySearchGridPaging.totalKnown = false;
                }

                this.taxonomySearchGridLastFilter = newFilterString;
                this.taxonomySearchGridLastSort = newSortString;

                let restParams: any = {
                    sortModel: rowParams.sortModel,
                    limit: this.taxonomySearchGridApi.paginationGetPageSize(),
                    offset: pageNumber - 1
                }

                if (CodeUtility.hasValue(query)){
                    restParams.query = query;
                }

                this.refsetService.getTaxonomySearch(this.id, restParams).subscribe(results => {

                    this.taxonomySearchResults = results.items;

                    if (results.items.length == 0 && pageNumber > 1) {

                        this.taxonomySearchGridPaging.totalRows = (this.taxonomySearchGridApi.paginationGetPageSize() * (pageNumber - 1));
                        this.taxonomySearchGridPaging.totalKnown = true;
                        this.taxonomySearchPaginationComponent.goToPage(pageNumber - 1);
                        return;
                    }

                    UiUtility.applyServerPagedGridResults(results, this.taxonomySearchGridApi, this.taxonomySearchGridPaging, pageNumber, rowParams);
                },
                error => {
                    
                    this.taxonomySearchResults = [];
                    this.taxonomySearchGridApi.showNoRowsOverlay();
                    rowParams.successCallback([], 0);
                });
            }
        };

        gridReadyParams.api.setDatasource(dataSource);

    }

    taxonomyPathValueGetter = function (params) {

        if (!CodeUtility.hasValue(params.data)) {
            return '';
        }

        let pathString = '';

        for (let pathConcept of params.data.parents) {
 
            let parentText = this.getTaxonomySearchDescription(pathConcept);
            pathString = CodeUtility.addIfNotEmpty(pathString, ' > ') + parentText;
        }

        return pathString;
    };

    taxonomyResultValueGetter = function (params) {

        if (!CodeUtility.hasValue(params.data)) {
            return '';
        }

        return this.getTaxonomySearchDescription(params.data);
    };

    getTaxonomySearchDescription(concept) {

        let text = '';
        let choosenDescription = concept.descriptions[this.selectedTaxonomyLanguageIndex];

        if (choosenDescription != null) {
            text = choosenDescription.term;

        } else if (concept.descriptions[0] != null) {
            text = concept.descriptions[0].term;
        } else {
            text = concept.name;
        }

        return text;
    }

    onTaxonomySearchGridCellClick = (event) => {

        let selectedRows = this.taxonomySearchGridApi.getSelectedRows();
        let selectedId: string;
        let selectedPath: any;

        selectedRows.forEach(function (selectedRow, index) {

            selectedId = selectedRow.code;
            selectedPath = selectedRow.parents;
            console.log('Selected Row: ' + selectedId);
        });

        this.goToTaxonomyConcept(selectedId, selectedPath);
    }

    @Debounce()
    onTaxonomySearchChange() {

        let showSearch = CodeUtility.hasValue(this.taxonomySearchInput) && (this.taxonomySearchResults.length > 0 || this.taxonomySearchInput.length > 2);

        if (showSearch) {

            this.taxonomySearchDisplay = 'block';

            if (this.taxonomySearchInput.length > 2) {
                this.taxonomySearchGridApi.purgeInfiniteCache();
            }
            
        } else {
            this.taxonomySearchDisplay = 'none';
        }
    }

    goToTaxonomyConcept(selectedConcept, selectedPath) {
        this.taxonomyMembersComponent.findNodeInTree(selectedConcept, selectedPath, undefined, true, false);
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

                if (CodeUtility.hasValue(this.tableSearchInput) && this.tableSearchInput.length > 2){
                    query = CodeUtility.addIfNotEmpty(query, ' AND ') + this.tableSearchInput;
                } else if (this.tableSearchInput && !CodeUtility.hasValue(this.tableSearchInput)) {
                    this.membersGridApi.showNoRowsOverlay();
                    rowParams.successCallback([], 0);
                    return;
                }

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

                let restParams: any = {
                    sortModel: rowParams.sortModel,
                    limit: this.membersGridApi.paginationGetPageSize(),
                    offset: pageNumber - 1,
                    displayType: 'list'
                }

                if (CodeUtility.hasValue(query)){
                    restParams.query = query;
                }

                this.refsetService.getMembersList(this.id, restParams).subscribe(results => {
                    if (results.items.length == 0 && pageNumber > 1) {
                        this.membersGridApi.showNoRowsOverlay();
                        this.membersGridPaging.totalRows = (this.membersGridApi.paginationGetPageSize() * (pageNumber - 1));
                        this.membersGridPaging.totalKnown = true;
                        this.membersPaginationComponent.goToPage(pageNumber - 1);
                        return;
                    }

                    let data = results.items;
                    this.membersGridData = data;

                    if (!data.length) {
                        this.membersGridApi.showNoRowsOverlay();
                        rowParams.successCallback([], 0);
                        return;
                    }

                    this.membersColumnDefs = [
                        { field: 'code', headerName: 'Concept ID', flex: 1, minWidth: 120, cellClass: 'refset-tool-details-column-concept-id' }
                    ];

                    for (let i = 0; i < this.languageOptions.length; i++) {

                        let language = this.languageOptions[i];
                        let minWidth = language.value === '101FSN' ? 250 : 190;
                        this.membersColumnDefs.push({ field: i.toString(), flex: 1, minWidth: minWidth, colId: language.value, headerName: language.display, cellClass: 'refset-tool-details-column-description', valueGetter: this.descriptionValueGetter });
                    }

                    this.membersColumnDefs.push(...[
                        { field: 'memberEffectiveTime', colId: 'modified', flex: 1, minWidth: 150, headerName: 'Modified Date', cellClass: 'refset-tool-details-column-modified-date', valueGetter: UiUtility.gridDateValueGetter },
                        { field: 'active', colId: 'actions', headerName: '', width: 120, minWidth: 120, cellClass: 'refset-tool-details-column-actions', cellRenderer: 'templateRenderer', cellRendererParams: { template: this.actionSection }, filter: false, pinned: 'right' }
                    ]);

                    if (data.length > 0) {

                        this.membersGridApi.hideOverlay();
                        let currentRowCount = null;
                        let lastRow = -1;

                        if (results.totalKnown || data.length < this.membersGridApi.paginationGetPageSize() || this.membersGridPaging.totalKnown) {

                            if (results.totalKnown) {

                                lastRow = results.total;

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
                        rowParams.successCallback([], 0);
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

            let selectedConcept = this.getMemberRow(selectedId);
            this.loadConceptDetail(selectedConcept);
            

            //this.router.navigate(['/details', selectedId]);
        }
    }

    @Debounce()
    onTableSearchChange() {

        if (!CodeUtility.hasValue(this.tableSearchInput) || (CodeUtility.hasValue(this.tableSearchInput) && this.tableSearchInput.length > 2)) {
            this.membersGridApi.purgeInfiniteCache();
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

    loadConceptDetail(concept) {

        this.conceptDetail = null;
        this.isConceptDetailsLoading = true;

        this.refsetService.getMembersDetails(concept.code, {refsetInternalId: this.refsetData.id}).subscribe(results => {

            this.isConceptDetailsLoading = false;
            this.conceptDetail = results;
            
            this.conceptDescriptions = this.conceptDetail.descriptions.filter(function (description) {
                return description != null;
            });

            RefsetUtility.sortDescriptions(this.conceptDescriptions, this.refsetData.edition.fullyQualifiedLanguageRefsets);
        });
        
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
        this.router.navigate(['/details', this.selectedVersion]).then(page => { window.location.reload(); });;
    }

    openAuditTrail() {

        const dialogId = 'refsetAuditDialog';

        const dialogData = {
            headerText: `Refset Audit Trail for ${this.refsetData.name} (${this.refsetData.refsetId})`,
            template: this.refsetAuditDialog,
            data: this.refsetData
        }

        const dialogOptions = {
            id: dialogId
        }

        this.dialog = this.dialogFactoryService.open(dialogData);

        this.dialog.confirmed().subscribe(data => {
        });
    }

    openArtifacts() {

        const dialogId = 'refsetArtifactsDialog';

        const dialogData = {
            headerText: `Refset Artifacts for ${this.refsetData.name} (${this.refsetData.refsetId})`,
            template: this.refsetArtifactsDialog,
            data: this.refsetData
        }

        const dialogOptions = {
            id: dialogId
        }

        this.dialog = this.dialogFactoryService.open(dialogData);

        this.dialog.confirmed().subscribe(data => {
        });
    }

    openRefsetFeedback() {

        const dialogId = 'refsetFeedbackDialog';

        const dialogData = {
            headerText: `Refset Feedback for ${this.refsetData.name} (${this.refsetData.refsetId})`,
            template: this.refsetFeedbackDialog,
            data: this.refsetData
        }

        const dialogOptions = {
            id: dialogId
        }

        this.dialog = this.dialogFactoryService.open(dialogData);

        this.dialog.confirmed().subscribe(data => {
        });
    }

    changeLanguage() {

    }

    onChangeMembersListMode() {
        
        if (this.selectedMembersListMode == 'table') {

            this.membersTableDisplay = 'inline-block';
            this.membersTaxonomyDisplay = 'none';
        } else {
            this.membersTableDisplay = 'none';
            this.membersTaxonomyDisplay = 'inline-block';
        }
    }

    openMemberFeedback(conceptId: string) {

        let concept = this.getMemberRow(conceptId);
        const dialogId = 'conceptFeedbackDialog';

        const dialogData = {
            headerText: `Member Feedback for ${concept.name} (${conceptId})`,
            template: this.memberFeedbackDialog,
            data: concept
        }

        const dialogOptions = {
            id: dialogId
        }

        this.dialog = this.dialogFactoryService.open(dialogData);

        this.dialog.confirmed().subscribe(data => {
        });
    }

    openMemberHistory(conceptId) {

        let concept = this.getMemberRow(conceptId);

         this.refsetService.getMemberHistory(this.refsetData.id, conceptId, null).subscribe(results => {

            let historyData: any = {};
            historyData.name = `${concept.name} (${concept.code})`;

            historyData.columnDefs = [
                { field: 'version', headerName: 'Version', cellClass: 'refset-tool-member-history-column-version' },
                { field: 'change', headerName: 'Change', cellClass: 'refset-tool-member-history-column-change' }
            ];
            
            
            historyData.gridOptions = {
                pagination: false,
                suppressColumnVirtualisation: true, // need this so you can access rows and cells that might not be currently visible, including if the grid is hidden
                loadingCellRenderer: 'agLoadingOverlay',
                rowModelType: 'clientSide',
                rowData: results.items,
                rowSelection: 'single',
                defaultColDef: {
                    sortable: true,
                    filter: false,
                    floatingFilter: false,
                    suppressMenu: true
                }
            };

            const dialogId = 'memberHistoryDialog';

            const dialogData = {
                headerText: `History By Reference Set Member`,
                showCancel: false,
                template: this.memberHistoryDialog,
                data: historyData,
            }

            const dialogOptions = {
                id: dialogId
            }

            this.dialog = this.dialogFactoryService.open(dialogData);
        });
        
    }

    clearSearch(field) {

        let value;

        if (field == 'table') {
            value = 'tableSearchInput';
        } else {
            value = 'taxonomySearchInput';
        }

        if (this[value] != '') {

            this[value] = '';
            this['on' + CodeUtility.toTitleCase(field) + 'SearchChange']();
        }
    }

    addSpaceAfterVersionDate(stringValue: string): string {
        if (stringValue?.includes('(')) {
            return stringValue.split('(').join(' (');
        }

        return stringValue;
    }

    capitalizeFirstLetterOfString(stringValue: string): string {
        if (stringValue) {
            return stringValue.replace(/(?:^|\s|[-"'([{])+\S/g, (c) => c.toUpperCase());
        }

        return stringValue;
    }

    showMembersSearchBar(): boolean {
        return (this.showTable && this.membersTableDisplay === 'inline-block' && this.membersTaxonomyDisplay === 'none')
        || (this.showTaxonomySearchTable && this.membersTaxonomyDisplay === 'inline-block' && this.membersTableDisplay === 'none')
    }

    setFullNarrativeText(show: boolean): void {
        this.showFullNarrativeText = show;
    }

    setFullNotesText(show: boolean): void {
        this.showFullNotesText = show;
    }
}