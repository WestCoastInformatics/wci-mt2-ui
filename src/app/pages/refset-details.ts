import { ChangeDetectorRef, Component, TemplateRef, ViewChild } from '@angular/core';
import { MatPaginator, PageEvent } from '@angular/material/paginator';
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
    selectedLanguage: string = '1';
    membersGridApi: any;
    membersGridColumnApi: any;
    membersColumnDefs = [];
    membersGridOptions: any;
    membersGridPaging = {
        pageSize: 10,
        pageSizeOptions: [10, 25, 50, 100]
    };
    pageEvent: PageEvent;
    showTable: boolean;
    refsetData: any;
    membersGridData: any;
    membersTreeData: any;
    dialog: DialogService;

    @ViewChild('detailsActionSection') actionSection: TemplateRef<any>; 


    constructor(
        private route: ActivatedRoute,
        private router: Router,
        private titleService: Title,
        private dialogFactoryService: DialogFactoryService,
        private refsetService: RefsetService,
        private changeDetectorRef: ChangeDetectorRef
    ) {
    }

    //***** Framework Functions *****/
    ngOnInit() {

        this.refsetId = this.route.snapshot.paramMap.get('refsetId');
        this.titleService.setTitle('Refset Tool - Refset Details: ' + this.refsetId);

        this.refsetService.getRefset(this.refsetId).subscribe(results => {

            this.refsetData = results;

            if (CodeUtility.hasValue(this.refsetData)) {


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
    }

    //***** Members Grid Functions *****/
    onMembersGridReady = (gridReadyParams) => {

        console.log("In onGridReady", this.actionSection);
        this.membersGridApi = gridReadyParams.api;
        this.membersGridColumnApi = gridReadyParams.columnApi;

        let dataSource = {
            rowCount: null,
            getRows: (rowParams) => {

                this.membersGridApi.showLoadingOverlay();

                let pageNumber = rowParams.endRow / this.membersGridApi.paginationGetPageSize();
                let query = UiUtility.formatFilterData(rowParams.filterModel);
                let viewFilter = ''

                query = CodeUtility.addIfNotEmpty(query, ' AND ') + viewFilter;
                query = CodeUtility.addIfNotEmpty(query, ' AND ') + this.searchInput;

                let restParams = {
                    query: query,
                    sortModel: rowParams.sortModel,
                    limit: this.membersGridApi.paginationGetPageSize(),
                    offset: pageNumber
                }

                this.refsetService.getMembersList(this.refsetId, restParams).subscribe(results => {

                    let data = results.items;
                    this.membersGridData = data;

                    // get the languages we will be using as columns
                    let languages = results.languages;

                    this.membersColumnDefs = [
                        { field: 'conceptId', headerName: 'Refset ID', cellClass: 'refset-tool-details-column-concept-id' }
                    ];

                    for (let language of languages){
                        this.membersColumnDefs.push({ field: 'descriptions[' + language.languageId + ']', colId: 'description' + language.languageId, headerName: language.name, cellClass: 'refset-tool-details-column-description' });
                    }

                    this.membersColumnDefs.push(...[
                        { field: 'modified', headerName: 'Modified Date', cellClass: 'refset-tool-details-column-modified-date' },
                        { field: 'id', colId: 'actions', headerName: '', cellRenderer: 'templateRenderer', width: 70, cellClass: 'refset-tool-details-column-actions', cellRendererParams: { template: this.actionSection }, filter: false }
                    ]);

                    if (data.length > 0) {

                        this.membersGridApi.hideOverlay();
                        let currentRowCount = null;
                        let lastRow = -1;

                        if (results.totalKnown || data.length < this.membersGridApi.paginationGetPageSize()) {

                            if (results.totalKnown) {

                                lastRow = results.totalResults;
                            } else {

                                currentRowCount = data.length + ((pageNumber - 1) * this.membersGridApi.paginationGetPageSize());
                                lastRow = currentRowCount;
                            }
                        } else {
                            currentRowCount = data.length + ((pageNumber - 1) * this.membersGridApi.paginationGetPageSize());
                        }
                        
                        rowParams.successCallback(data, lastRow);
                    } else {

                        this.membersGridApi.showNoRowsOverlay();
                        rowParams.successCallback(data, 0);
                    }

                    this.showTable = true
                    this.changeDetectorRef.detectChanges();
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