import { ChangeDetectorRef, Component, TemplateRef, ViewChild } from '@angular/core';
import { Router, ActivatedRoute, ParamMap } from '@angular/router';
import { DialogService } from 'src/app/dialog/services/dialog.service';
import { DialogFactoryService } from 'src/app/dialog/services/dialog-factory.service';
import { Observable } from 'rxjs';
import { AgGridAngular } from 'ag-grid-angular';
import { TemplateRenderer } from 'src/app/components/cellRenderers/template.renderer';
import { RefsetService } from 'src/app/services/rest/refset.service';
import { Title } from '@angular/platform-browser';
import { Refset } from 'src/app/models/refset';
import { CodeUtility } from 'src/app/utilities/code.utility';
import { UiUtility } from 'src/app/utilities/ui.utility';
import { BreadcrumbService } from 'src/app/services/breadcrumb.service';
import { PaginationComponent } from 'src/app/components/pagination/pagination.component';


/**
 * @title Tree with nested nodes
 */
@Component({
    selector: 'app-refset-details',
    templateUrl: 'refset-details.html'
})

export class RefsetDetails {

    refsetId: string;
    searchInput: string;
    versionOptions = [{ value: '3', display: 'Published (2021-01-15)' }, { value: '2', display: 'In Development' }, { value: '1', display: 'Beta (2020-11-23)' }];
    selectedVersion: string = '3';
    languageOptions = [{ value: '1', display: 'US English (PT)' }, { value: '2', display: 'Belgian French (PT)' }, { value: '3', display: 'Flemish (PT)' }];
    selectedLanguage: string[] = ['1', '2'];
    selectedMemebersListMode: string = 'table';
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
    }

    //***** Framework Functions *****/
    ngOnInit() {

        this.refsetId = this.route.snapshot.paramMap.get('refsetId');
        this.titleService.setTitle('Refset Tool - Refset Details: ' + this.refsetId);
        this.breadcrumbService.setBreadcrumbs([{path: '/directory', label: 'Directory'}, {label: 'Refset Details'}]);

        this.refsetService.getRefset(this.refsetId).subscribe(results => {

            this.refsetData = results;

            if (CodeUtility.hasValue(this.refsetData)) {

                this.shortenNoteFields();

            } else {

                console.log('Error loading refset details data.');
            }
        });
    }

    ngAfterViewInit() {

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
    }

    //***** Members Grid Functions *****/
    onMembersGridReady = (gridReadyParams) => {

        console.log("In onGridReady", this.actionSection);
        this.membersGridApi = gridReadyParams.api;
        this.membersGridColumnApi = gridReadyParams.columnApi;
        let refsetLanguages = [{languageId: 'EN (PT)', languageName: 'EN (PT)'}, {languageId: 'EN (FSN)', languageName: 'EN (FSN)'}];

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

                this.refsetService.getMembersList(this.refsetId, restParams).subscribe(results => {

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

                    if (data.languages){
                        refsetLanguages = data.languages;
                    }

                    for (let i = 0; i < refsetLanguages.length; i++) {

                        let language = refsetLanguages[i];
                        let fieldPrefix = 'descriptions[' + i + '].';

                        this.membersColumnDefs.push({ field: i.toString(), colId: 'description' + language.languageId, headerName: language.languageName, cellClass: 'refset-tool-details-column-description', valueGetter: this.descriptionValueGetter });
                    }

                    this.membersColumnDefs.push(...[
                        { field: 'modified', headerName: 'Modified Date', cellClass: 'refset-tool-details-column-modified-date' },
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
                selectedId = selectedRow.conceptId;
                console.log('Selected Row: ' + selectedId);
            });

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
}