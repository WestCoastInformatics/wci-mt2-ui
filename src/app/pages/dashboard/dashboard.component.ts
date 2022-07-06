import { Component, OnInit, TemplateRef, ViewChild } from '@angular/core';
import { Title } from '@angular/platform-browser';
import { ActivatedRoute, Router } from '@angular/router';
import { IServerSideDatasource } from 'ag-grid-community';
import { CategoryFilterComponent } from 'src/app/components/categoryFilter/category-filter.component';
import { TemplateRenderer } from 'src/app/components/cellRenderers/template.renderer';
import { AuthenticationService } from 'src/app/services/authentication/authentication.service';
import { BreadcrumbService } from 'src/app/services/breadcrumb.service';
import { RefsetService } from 'src/app/services/rest/refset.service';
import { CodeUtility } from 'src/app/utilities/code.utility';
import { RefsetUtility } from 'src/app/utilities/refset.utility';
import { UiUtility } from 'src/app/utilities/ui.utility';

@Component({
    selector: 'app-dashboard',
    templateUrl: './dashboard.component.html'
})
export class DashboardComponent implements OnInit {

    @ViewChild('dashboardWorkflowStatusSection') workflowStatus: TemplateRef<any>;

    // Dashboard Variables
    searchText = '';
    organizationList = [];
    projectList = [];
    teamList = [];
    currentUser: any;
    uiUtility = UiUtility;

    // Table Variables
    defaultColDef: any;
    columnDefs = [];
    data = [];
    api: any;
    columnApi: any;
    searchInput: string;
    selectedView: string = 'all';
    refsetGridApi: any;
    refsetGridColumnApi: any;
    refsetGridOptions: any;
    refsetGridLastFilter: string = '';
    refsetGridLastSort: string = '';
    numOfResults: any;
    numOfMembers: any;
    showLoadingSpinner = false;

    constructor(
        private router: Router,
        private readonly route: ActivatedRoute,
        private readonly breadcrumbService: BreadcrumbService,
        private readonly titleService: Title,
        private readonly refsetService: RefsetService,
        private readonly authService: AuthenticationService) { }

    ngOnInit(): void {

        this.titleService.setTitle('Refset Tool - Dashboard');
        this.breadcrumbService.setBreadcrumbs([
            { path: '/dashboard', label: 'Dashboard' }
        ]);
        this.currentUser = this.authService.getUser();
        this.refsetGridOptions = {
            context: { componentParent: this },
            rowModelType: 'infinite',
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
                suppressMenu: true,
                menuTabs: ['columnsMenuTab'],
                resizable: true
            }
        };
        this.getOrganizations();
        this.getProjects();
    }

    ngAfterViewInit() {
        this.columnDefs = [
            {
                field: 'name', headerName: 'Reference Set', flex: 1, minWidth: 550, unSortIcon: true, sortable: true, cellRenderer: params => {
                    return params.data ? `${params.data.name}` + (params.data.private ? '<i class="ml-3 text-muted fa fa-lock"></i>' : '') : '';
                }, cellClass: 'pointer'
            },
            {
                field: 'workflowStatus', headerName: 'Workflow Status', unSortIcon: true, cellClass: 'refset-tool-dashboard-column-workflow-status',
                cellRenderer: 'templateRenderer', cellRendererParams: { template: this.workflowStatus },
                sortable: true, floatingFilterComponent: 'categoryFilterComponent',
                floatingFilterComponentParams: {
                    suppressFilterButton: true, names: [
                        { type: 'status', name: "In Development", value: "IN_DEVELOPMENT" },
                        { type: 'status', name: 'Ready For Edit', value: 'READY_FOR_EDIT' },
                        { type: 'status', name: 'In Edit', value: 'IN_EDIT' },
                        { type: 'status', name: 'In Upgrade', value: 'IN_UPGRADE' },
                        { type: 'status', name: 'Ready For Review', value: 'READY_FOR_REVIEW' },
                        { type: 'status', name: 'In Review', value: 'IN_REVIEW' },
                        { type: 'status', name: 'Review Completed', value: 'REVIEW_COMPLETED' },
                        { type: 'status', name: 'Ready For Publication', value: 'READY_FOR_PUBLICATION' },
                        { type: 'status', name: 'Published', value: 'PUBLISHED' }
                    ]
                }
            },
            {
                field: 'modified', tooltipField: 'modified', headerName: 'Last Modified', filter: false, unSortIcon: true, sortable: true, valueGetter:
                    UiUtility.gridDateValueGetter,
            }
        ];

    }


    // onGridReady = (params) => {
    //     this.api = params.api;
    //     this.columnApi = params.columnApi;
    //     this.getRefSets();
    // }

    onGridReady = (gridReadyParams) => {
        this.refsetGridApi = gridReadyParams.api;
        this.refsetGridColumnApi = gridReadyParams.columnApi;
        let dataSource = {
            rowCount: null,
            getRows: (rowParams) => {

                this.refsetGridApi.showLoadingOverlay();
                // this.showLoadingSpinner = true;

                let pageNumber = rowParams.endRow / this.refsetGridApi.paginationGetPageSize();
                let query = UiUtility.formatFilterData(rowParams.filterModel);
                let sort = UiUtility.formatSortData(rowParams.sortModel);

                let newFilterString = query;
                let newSortString = JSON.stringify(sort);

                // if the filters or sort have changed then move to the first page
                if (newFilterString !== this.refsetGridLastFilter || newSortString !== this.refsetGridLastSort) {

                    pageNumber = 1;
                    this.refsetGridApi?.api?.paginationGoToPage(0);
                }


                this.refsetGridLastFilter = newFilterString;
                this.refsetGridLastSort = newSortString;

                let restParams: any = {
                    limit: 500,
                    offset: 0,
                    searchConcepts: true,
                    showInDevelopment: true,
                    sortModel: rowParams.sortModel, //not needed once we get rid of mocking the backend
                    filterModel: rowParams.filterModel, //not needed once we get rid of mocking the backend
                };

                if (CodeUtility.hasValue(query)) {

                    query = query.replace(/\//g, '%2F').replace(/\%/g, '%25');
                    restParams.query = query;
                }
                this.data = [];
                this.refsetService.getRefsets({ ...restParams, ...sort }).subscribe({
                    next: (results) => {

                        for (let refset of results.items) {
                            this.data.push({
                                name: `${refset?.organizationName}/${refset?.project?.name}/${refset.name}`
                                , refsetId: refset.refsetId
                                , private: refset.privateRefset
                                , workflowStatus: `${refset?.workflowStatus}`
                                , modified: `${refset?.modified}`, versionStatus: `${refset.versionStatus}`
                                , versionDate: `${refset.versionDate}`
                            })

                        }
                        this.data = this.data.slice(0, 10);
                        let data = this.data;

                        if (data?.length > 0) {

                            this.refsetGridApi.hideOverlay();


                            rowParams.successCallback(data, data.length);

                        } else {

                            this.refsetGridApi.showNoRowsOverlay();
                            rowParams.successCallback([], 0);
                        }

                    },
                    error: (error) => {

                        this.refsetGridApi.showNoRowsOverlay();
                        rowParams.successCallback([], 0);
                    }
                });
            }
        };

        gridReadyParams.api.setDatasource(dataSource);

        // set placeholders on the grid floating filter fields
        Array.from(document.querySelectorAll('.ag-floating-filter-full-body .ag-input-field-input')).forEach((obj: any) => {

            if (obj.attributes['disabled']) {
                // skip columns with disabled filter
                return;
            }

            let label = obj.getAttribute('aria-label');
            let value = label.substring(0, label.indexOf('Filter Input')) + '...';
            obj.setAttribute('placeholder', value);
        });

        this.getTeams();
    };

    toTitleCase(str) {
      return str.replace(
        /\w\S*/g,
        function(txt) {
          return txt.charAt(0).toUpperCase() + txt.substr(1).toLowerCase();
        }
      );
    }

    onGridCellClick = (event) => {
        if (event.column.colId === 'name') {
            const refsetId = event.data.refsetId;
            const versionDate = RefsetUtility.getVersionDateForRefsetApiCall(event.data);

            this.goToDetailsPage(refsetId, versionDate);

        }
    }

    goToDetailsPage(refsetId, versionDate) {
        this.router.navigate(['/details', refsetId, versionDate]);
    }

    getOrganizations(): void {
        this.refsetService.getOrganizations().subscribe((results) => {
            this.organizationList = results.items;
        });
    }

    getRefSets(): void {
        this.refsetService.getRefsets(`limit=500&offset=0&sort=name&sortAscending=true&assignedUser=${this.currentUser.userName}`, false).subscribe((x) => {
            for (let refset of x.items) {
                this.data.push({
                    name: `${refset?.organizationName}/${refset?.project?.name}/${refset.name}`
                    , refsetId: refset.refsetId
                    , private: refset.privateRefset
                    , workflowStatus: `${refset?.workflowStatus}`
                    , modified: `${refset?.modified}`, versionStatus: `${refset.versionStatus}`, versionDate: `${refset.versionDate}`
                })


            }
            this.api.setRowData(this.data.slice(0, 10));
            this.api.redrawRows();
        });
    }

    getProjects(): void {
        this.refsetService.getProjects('limit=500&offset=0&sort=name&sortAscending=true').subscribe((results) => {
            this.projectList = results.items;
        });
    }

    getTeams(): void {
        this.refsetService.getTeams('limit=500&offset=0&sort=name&sortAscending=true').subscribe((results) => {
            for (var team of results.items) {
                if (team?.members) {
                for (var member of team?.members) {
                    if (member.includes(this.currentUser.id)) {
                        this.teamList.push(team);
                    }
                }
            }
            }

            /**this.teamList = results.items.filter((x) => {
                return x.members.some((member) => {
                    return member.includes(this.currentUser.id);
                });
            }); */
        });
    }

}
