import { AfterViewInit, ChangeDetectorRef, Component, OnInit, TemplateRef, ViewChild } from '@angular/core';
import { Title } from '@angular/platform-browser';
import { Router } from '@angular/router';
import { forkJoin } from 'rxjs';
import { CategoryFilterComponent } from 'src/app/components/categoryFilter/category-filter.component';
import { TemplateRenderer } from 'src/app/components/cellRenderers/template.renderer';
import { Debounce } from 'src/app/decorators/debounce.decorator';
import { DialogService } from 'src/app/dialog/services/dialog.service';
import { BreadcrumbService } from 'src/app/services/breadcrumb.service';
import { RefsetService } from 'src/app/services/rest/refset.service';
import { ToggleService } from 'src/app/services/toggle-service/toggle.service';
import { CodeUtility } from 'src/app/utilities/code.utility';
import { UiUtility } from 'src/app/utilities/ui.utility';

@Component({
  selector: 'projects-refset',
  templateUrl: './projects-refset.component.html',
  styleUrls: ['./projects-refset.component.scss']
})
export class ProjectsRefsetComponent implements OnInit, AfterViewInit {

    searchInput: string;
    viewOptions = [{ value: 'all', display: 'All' }, { value: 'public', display: 'Public' }, { value: 'private', display: 'Private' }];
    selectedView: string = 'all';
    refsetGridApi: any;
    refsetGridColumnApi: any;
    columnDefs = [];
    refsetGridOptions: any;
    refsetGridLastFilter: string = '';
    refsetGridLastSort: string = '';
    showTable: boolean = false;
    refsetData: any;
    dialog: DialogService;
	versionStatuses: any; 
    initialGridWidth: number;
    showFullNarrativeText = false;
    showFullNotesText = false;
    dummydata = ['Your Usual Project', 'Project 2', 'Project 3'];
    selectedValue = this.dummydata[0];
    @ViewChild('directoryNameSection') nameSection: TemplateRef<any>;
    @ViewChild('directoryNameSection') workflowSection: TemplateRef<any>;
    metadataAndConcepts = true;

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
        // console.log('look at me');
        // this.refsetService.getProjects('limit=500&offset=0&sort=name&sortAscending=false').subscribe(x => {
        //     console.log(x);
        // })
    }

    ngAfterViewInit() {
		forkJoin(
        	this.refsetService.getVersionStatuses(),
			this.refsetService.getVersions(),
			this.refsetService.getEditions(),
			this.refsetService.getOrganizations(),
		).subscribe(x => {
            console.log(x)
	    this.columnDefs = [
            { field: 'refsetId', headerName: 'Refset ID', cellClass: 'refset-tool-directory-column-id', flex: 1},
            { field: 'name', headerName: 'Refset Name', cellClass: 'refset-tool-directory-column-name', flex: 1, cellRenderer: 'templateRenderer', cellRendererParams: { template: this.nameSection }, sort: 'asc' },
            { field: 'workflowStatus', headerName: 'Workflow Status', cellClass: 'refset-tool-directory-column-workflow', flex: 1, cellRenderer: 'templateRenderer', cellRendererParams: { template: this.workflowSection }, floatingFilterComponent: 'categoryFilterComponent'},
            { field: 'modified', headerName: 'Last Modified Date', cellClass: 'refset-tool-directory-column-modified-date', flex: 1, valueGetter: UiUtility.gridDateValueGetter },
            { field: 'published', headerName: 'Last Published Date', cellClass: 'refset-tool-directory-column-modified-date', flex: 1, valueGetter: UiUtility.gridDateValueGetter },
        ];
        this.refsetGridOptions = {
            context: { componentParent: this },
            pagination: true,
            suppressColumnVirtualisation: true,
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


    //***** AG Grid Functions *****/
    onGridReady = (gridReadyParams) => {
        console.log(gridReadyParams)
        this.refsetGridApi = gridReadyParams.api;
        this.refsetGridColumnApi = gridReadyParams.columnApi;

        let dataSource = {
            rowCount: null,
            getRows: (rowParams) => {

                this.refsetGridApi.showLoadingOverlay();

                let query = UiUtility.formatFilterData(rowParams.filterModel);
                let sort = UiUtility.formatSortData(rowParams.sortModel);



                let restParams: any = {
                    limit: this.refsetGridApi.paginationGetPageSize(),
                    sortModel: rowParams.sortModel, //not needed once we get rid of mocking the backend
                    filterModel: rowParams.filterModel, //not needed once we get rid of mocking the backend
                }

                if (CodeUtility.hasValue(query)){
                    restParams.query = query;
                }

                this.refsetService.getRefsets({...restParams, ...sort}).subscribe(results => {


                    let data = results.items;
                    this.refsetData = data;

                    if (data?.length > 0) {

                        this.refsetGridApi.hideOverlay();
                        let lastRow = -1;

                        
                        rowParams.successCallback(data, lastRow);
                    } else {

                        this.refsetGridApi.showNoRowsOverlay();
                        rowParams.successCallback([], 0);
                    }
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

            this.goToDetailsPage(selectedId);
        }
    }

    @Debounce()
    changedViewFilter() {
        this.refsetGridApi.purgeInfiniteCache();
    }

    //***** General Functions *****/

    goToDetailsPage(refsetId){
        this.router.navigate(['/details', refsetId]);
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
}
