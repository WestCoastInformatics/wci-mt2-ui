import { AfterViewInit, ChangeDetectorRef, Component, OnInit, TemplateRef, ViewChild } from '@angular/core';
import { Title } from '@angular/platform-browser';
import { Router } from '@angular/router';
import { Context } from 'ag-grid-community';
import { forkJoin } from 'rxjs';
import { CategoryFilterComponent } from 'src/app/components/categoryFilter/category-filter.component';
import { TemplateRenderer } from 'src/app/components/cellRenderers/template.renderer';
import { PaginationComponent } from 'src/app/components/pagination/pagination.component';
import { Debounce } from 'src/app/decorators/debounce.decorator';
import { DialogService } from 'src/app/dialog/services/dialog.service';
import { BreadcrumbService } from 'src/app/services/breadcrumb.service';
import { RefsetService } from 'src/app/services/rest/refset.service';
import { ToggleService } from 'src/app/services/toggle-service/toggle.service';
import { CodeUtility } from 'src/app/utilities/code.utility';
import { RefsetUtility } from 'src/app/utilities/refset.utility';
import { UiUtility } from 'src/app/utilities/ui.utility';

@Component({
  selector: 'projects-refset',
  templateUrl: './projects-refset.component.html'
})
export class ProjectsRefsetComponent implements OnInit, AfterViewInit {

    searchInput: string;
    viewOptions = [{ value: 'all', display: 'All' }, { value: 'public', display: 'Public' }, { value: 'private', display: 'Private' }];
    selectedView: string = 'all';
    refsetGridApi: any;
    refsetGridColumnApi: any;
    columnDefs = [];
    refsetGridColumns = [{name: 'information', show: true}, {name: 'refsetId', show: true}];
    refsetGridOptions: any;
    refsetGridPaging = {
        pageSize: 10,
        pageSizeOptions: [10, 25, 50, 100],
        totalKnown: false,
        totalRows: null,
        manualStateRefresh: new Boolean(true)
    };
    refsetGridLastFilter: string = '';
    refsetGridLastSort: string = '';
    showTable: boolean = false;
    refsetData: any;
    dialog: DialogService;
	versionStatuses: any; 
    initialGridWidth: number;
    showFullNarrativeText = false;
    showFullNotesText = false;
    
    @ViewChild('directoryNameSection') nameSection: TemplateRef<any>;
    @ViewChild('directoryPaging') paginationComponent: PaginationComponent;
    @ViewChild('directoryCategoryFilter') categoryFilter: TemplateRef<any>;

    metadataAndConcepts = true;
    dummydata = ['Your Usual Project', 'Project 2', 'Project 3'];
    selectedValue = this.dummydata[0];
    projects = [];
    selectedProject: any;
    context: Context;
    originalGridParams: any;
    existingMetadataConcepts: any;
    existingBranchVersions: any;

    constructor(
        private router: Router,
        private titleService: Title,
        private refsetService: RefsetService,
        private changeDetectorRef: ChangeDetectorRef,
        private breadcrumbService: BreadcrumbService,
        readonly toggleService: ToggleService
    ) {
        refsetService.getTaxonomyRoot();
    }

    //***** Framework Functions *****/
    ngOnInit() {
        this.titleService.setTitle('Refset Tool - Projects');
        this.breadcrumbService.setBreadcrumbs([{path: '/Projects', label: 'Projects'}, {label: 'Reference Sets'}]);
        this.populateProjectList();
    }

    populateProjectList(): void {
        this.refsetService.getProjects('limit=500&offset=0&sort=name&sortAscending=false').subscribe(project => {
            console.log(project.items);
            this.projects = project.items;
        });
    }
    ngAfterViewInit() {
		forkJoin(
        	this.refsetService.getVersionStatuses(),
			this.refsetService.getEditions(),
		).subscribe(([results]) => {

            this.versionStatuses = results;

	    this.columnDefs = [
            { field: 'refsetId', headerName: 'Refset ID', cellClass: 'refset-tool-directory-column-id', flex: 1, minWidth: 155},
            { field: 'name', headerName: 'Refset Name', cellClass: 'refset-tool-directory-column-name', flex: 1, minWidth: 550, cellRenderer: 'templateRenderer', cellRendererParams: { template: this.nameSection }},            
            { field: 'versionStatus', headerName: 'Version Status', cellClass: 'refset-tool-directory-column-version-status', flex: 1, minWidth: 150},
            // { field: 'workflowStatus', headerName: 'Workflow Status', cellClass: 'refset-tool-directory-column-edition', flex: 1, minWidth: 170, cellRenderer: 'templateRenderer'},
            { field: 'versionDate', headerName: 'Version Date', cellClass: 'refset-tool-directory-column-modified-date', flex: 1, minWidth: 180, valueGetter: UiUtility.gridDateValueGetter },
            { field: 'modified', headerName: 'Last Modified Date', cellClass: 'refset-tool-directory-column-modified-date', flex: 1, minWidth: 180, valueGetter: UiUtility.gridDateValueGetter, sort: 'desc' }
        ];
        this.refsetGridOptions = {
            context: { componentParent: this },
            pagination: true,
            suppressColumnVirtualisation: true, // need this so you can access rows and cells that might not be currently visible, including if the grid is hidden
            suppressPaginationPanel: true,
            paginationPageSize: this.refsetGridPaging.pageSize,
            cacheBlockSize: this.refsetGridPaging.pageSize,
            maxBlocksInCache: 1,
            rowModelType: 'infinite',
            enableCellTextSelection: true,
            rowSelection: 'single',
            onCellClicked: this.onGridCellClick,
            onGridReady: this.onGridReady,
            frameworkComponents: {
                'templateRenderer': TemplateRenderer,
				'categoryFilterComponent': CategoryFilterComponent
            },
            defaultColDef: {
                sortable: true,
                filter: true,
                floatingFilter: true,
                floatingFilterComponentParams: { placeholder: '', suppressFilterButton: true },
                suppressMenu: false,
                menuTabs: ['columnsMenuTab'],
                resizable: true
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
        this.changeDetectorRef.detectChanges();
});
    }


    onGridReady = (gridReadyParams) => {
        this.getConceptDropdownData(false);
        this.getBranchVersions();
        this.originalGridParams = gridReadyParams;
        this.refsetGridApi = gridReadyParams.api;
        this.refsetGridColumnApi = gridReadyParams.columnApi;

        let dataSource = {
            rowCount: null,
            getRows: (rowParams) => {

                this.refsetGridApi.showLoadingOverlay();

                let pageNumber = rowParams.endRow / this.refsetGridApi.paginationGetPageSize();
                let query = UiUtility.formatFilterData(rowParams.filterModel);
                let sort = UiUtility.formatSortData(rowParams.sortModel);

                if (CodeUtility.hasValue(this.searchInput) && this.searchInput.length > 2){
                    query = CodeUtility.addIfNotEmpty(query, ' AND ') + this.searchInput;
                }

                let newFilterString = query;
                let newSortString = JSON.stringify(sort);

                // if the filters or sort have changed then move to the first page
                if (newFilterString !== this.refsetGridLastFilter || newSortString !== this.refsetGridLastSort) {

                    pageNumber = 1;
                    this.refsetGridApi?.api?.paginationGoToPage(0);
                }

                // if the filters have changed then reset the total row variables
                if (newFilterString !== this.refsetGridLastFilter){

                    this.refsetGridPaging.totalRows = null;
                    this.refsetGridPaging.totalKnown = false;
                }

                this.refsetGridLastFilter = newFilterString;
                this.refsetGridLastSort = newSortString;

                let restParams: any = {
                    limit: this.refsetGridApi.paginationGetPageSize(),
                    offset: (pageNumber - 1) * this.refsetGridApi.paginationGetPageSize(),
                    searchConcepts: this.metadataAndConcepts,
                    sortModel: rowParams.sortModel,
                    filterModel: rowParams.filterModel,
                    query: this.selectedProject?.organization?.name ? this.selectedProject?.organization?.name : 'zzzzzzzzzzzz'
                }
                console.log('query');
                console.log(this.selectedProject?.organization?.name)

                this.refsetService.getRefsets({...restParams, ...sort}).subscribe(results => {
                    console.log(results)
                    if (results.items.length == 0 && pageNumber > 1) {

                        this.refsetGridPaging.totalRows = (this.refsetGridApi.paginationGetPageSize() * (pageNumber - 1));
                        this.refsetGridPaging.totalKnown = true;
                        this.paginationComponent.goToPage(pageNumber - 1);
                        return;
                    }

                    let data = results.items;
                    this.refsetData = data;

                    if (data?.length > 0) {

                        this.refsetGridApi.hideOverlay();
                        let currentRowCount = null;
                        let lastRow = -1;

                        if (results.totalKnown || data.length < this.refsetGridApi.paginationGetPageSize() || this.refsetGridPaging.totalKnown) {

                            if (results.totalKnown) {

                                lastRow = results.total;

                            } else if (this.refsetGridPaging.totalKnown) {

                                lastRow = this.refsetGridPaging.totalRows;
                            } else {

                                currentRowCount = data.length + ((pageNumber - 1) * this.refsetGridApi.paginationGetPageSize());
                                lastRow = currentRowCount;
                            }

                            this.refsetGridPaging.totalRows = lastRow;
                            this.refsetGridPaging.totalKnown = true;

                        } else {
                            currentRowCount = data.length + ((pageNumber - 1) * this.refsetGridApi.paginationGetPageSize());
                        }
                        
                        rowParams.successCallback(data, lastRow);
                    } else {

                        this.refsetGridApi.showNoRowsOverlay();
                        rowParams.successCallback([], 0);
                    }

                    this.refsetGridPaging.manualStateRefresh = new Boolean(true);
                },
                error => {
                    
                    this.refsetGridApi.showNoRowsOverlay();
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

    editionValueGetter = function (params) {

        if (!CodeUtility.hasValue(params?.data)){
            return '';
        }

        let flagIcon = RefsetUtility.getEditionFlagIcon(params?.data?.edition?.branch);
        params.data.flagIcon = flagIcon;
        return params?.data?.edition?.name;
    };

    onGridCellClick = (event) => {

        if (event.column.colId === 'information' || event.column.colId === 'actions') {


        } else {

            let selectedRows = this.refsetGridApi.getSelectedRows();
            let selectedId: string;
            console.log(selectedRows);

            selectedRows.forEach(function (selectedRow, index) {
                selectedId = selectedRow.id;
                console.log('Selected Row: ' + selectedRow.refsetId);
            });

            this.goToEditRefsetPage(selectedId);
        }
    }

    @Debounce()
    changedViewFilter() {
        this.refsetGridApi.purgeInfiniteCache();
    }

    goToEditRefsetPage(refsetId){
        this.router.navigate(['/edit/refset', refsetId]);
    }

    getRefsetRow(refsetId: string) {

        let refset;

        for (let i = 0; i < this.refsetData.length; i++) {

            if (this.refsetData[i].refsetId == refsetId) {

                refset = this.refsetData[i];
                break;
            }
        }

        return refset;
    }

    private getConceptDropdownData(areParentConcepts: boolean): void {
        if (this.selectedProject) {
            this.refsetService.getRefsetConcepts(`branch=${this.selectedProject?.organization?.edition?.branch.toString()}&areParentConcepts=${areParentConcepts}`).subscribe(results => {
                this.existingMetadataConcepts = results.items ? results.items : undefined;
                console.log(this.existingMetadataConcepts);
            });
        }
    }

    private getBranchVersions(): void {
        if (this.selectedProject) {
            this.refsetService.getBranchVersions(`branch=${this.selectedProject?.organization?.edition?.branch.toString()}`).subscribe(results => {
                this.existingBranchVersions = results.items ? results.items : undefined;
            });
        }
    }
}
