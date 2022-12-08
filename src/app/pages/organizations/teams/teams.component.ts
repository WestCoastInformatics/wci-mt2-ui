import { Component, OnInit, TemplateRef, ViewChild } from '@angular/core';
import { Location } from '@angular/common';
import { Title } from '@angular/platform-browser';
import { ActivatedRoute, Router } from '@angular/router';
import { SidebarMenuItem } from 'src/app/models/sidebar.menu-item.model';
import { BreadcrumbService } from 'src/app/services/breadcrumb.service';
import { RefsetService } from 'src/app/services/rest/refset.service';
import { TemplateRenderer } from 'src/app/components/cellRenderers/template.renderer';
import { CategoryFilterComponent } from 'src/app/components/categoryFilter/category-filter.component';

@Component({
    selector: 'organization-teams',
    templateUrl: './teams.component.html'
})
export class OrganizationTeamsComponent implements OnInit {
    menu: SidebarMenuItem[] = [];
    data = [];
    defaultColDef = {};
    teamList = [];
    selectedOrganization: any;
    organizationId: string;
    organizationList: any;
    showLoadingSpinner = true;
    gridParams: any;
    gridApi: any;
    gridColumnDefs = [];
    gridOptions: any;
    gridPaging = { pageSize: 10, pageSizeOptions: [10, 25, 50, 100], totalKnown: false, totalRows: null, manualStateRefresh: new Boolean(true) };

    @ViewChild('descriptionSection') descriptionSection: TemplateRef<any>;

    constructor(private readonly breadcrumbService: BreadcrumbService,
        private readonly titleService: Title,
        private readonly refsetService: RefsetService,
        private readonly route: ActivatedRoute,
        private readonly router: Router,
        private location: Location) {
        document.body.scrollTop = 0;
    }

    ngOnInit(): void {

        this.titleService.setTitle('Reference Set Tool - Organizations');

        this.route.params.subscribe(params => {

            this.organizationId = params['organizationId'];
            this.setNavigation();
        });

        this.getOrganizations();

        this.gridColumnDefs = [
            { field: 'id', hide: true },
            { field: 'name', tooltipField: 'name', headerName: 'Team Name', flex: 1, minWidth: 65, maxWidth: 500, unSortIcon: true, resizable: true },
            { field: 'description', tooltipField: 'description', headerName: 'Description', flex: 1, minWidth: 65, cellRenderer: 'templateRenderer', cellRendererParams: { template: this.descriptionSection }, unSortIcon: true, resizable: true },
            {
                field: 'role', tooltipField: 'role', headerName: 'Role', minWidth: 65, resizable: true, cellClass: 'text-camel', unSortIcon: true,
                filter: 'agTextColumnFilter',
                filterParams: {
                    textCustomComparator: (filter, value, filterText) => {
                        if (!value && filterText) { return false; }
                        if (!filterText) { return true; }
                        const filterTextLowerCase = filterText.toLowerCase();
                        return value.split(',').map((role) => role.trim().toLowerCase()).filter((role) => role === filterTextLowerCase).length > 0;
                    }
                },
                floatingFilterComponent: 'categoryFilterComponent', floatingFilterComponentParams: {
                    suppressMenu: true, suppressFilterButton: true, names: [
                        {
                            'type': 'role',
                            'name': 'Admin',
                            'value': 'Admin'
                        },
                        {
                            'type': 'role',
                            'name': 'Author',
                            'value': 'Author'
                        },
                        {
                            'type': 'role',
                            'name': 'Reviewer',
                            'value': 'Reviewer'
                        },
                        {
                            'type': 'role',
                            'name': 'Viewer',
                            'value': 'Viewer'
                        }
                    ],
                }
            },
            { field: 'email', tooltipField: 'email', headerName: 'Contact Email', minWidth: 65, resizable: true, unSortIcon: true},
            {
                field: 'members', headerName: 'Users', minWidth: 65, filter: false, resizable: true, sortable: false,
                cellClass: 'text-primary font-weight-bold', tooltipValueGetter: (params) => {
                    return params?.data?.memberList ? params.data.memberList.map(member => member.name).join(', ') : '';
                }
            }
        ];

        this.gridOptions = {
            context: { componentParent: this },
            pagination: false,
            suppressColumnVirtualisation: false, // need this so you can access rows and cells that might not be currently visible, including if the grid is hidden
            suppressPaginationPanel: true,
            paginationPageSize: this.gridPaging.pageSize,
            rowSelection: 'single',
            enableCellTextSelection: true,
            onCellClicked: this.onGridCellClick,
            onGridReady: this.onGridReady,
            frameworkComponents: {
                'templateRenderer': TemplateRenderer,
                'categoryFilterComponent': CategoryFilterComponent,
            },
            defaultColDef: {
                sortable: true,
                resizable: true,
                suppressMenu: true,
                filter: true,
                floatingFilter: true,
                floatingFilterComponentParams: { placeholder: '', suppressFilterButton: false, suppressAndOrCondition: true },
                unSortIcon: true
            },
            enableBrowserTooltips: true,
            rowClassRules: {
                refset_tool_grid_inactive_row: function (params) {

                    let inactivatedRow = false;

                    if (params.data) {
                        inactivatedRow = params.data.active == false;
                    }

                    return inactivatedRow;
                },
            },
        };

        this.data = [];
    }

    setNavigation() {

        this.breadcrumbService.setBreadcrumbs([
            { path: '/dashboard', label: 'Dashboard' },
            { label: this.selectedOrganization?.name ? this.selectedOrganization?.name + ' / Teams' : '' },
        ]);

        this.menu = [
            { name: 'Projects', link: '/organizations/' + this.organizationId + '/edition/0/projects', icon: 'fa fa-folder-open' },
            { name: 'Teams', link: '/organizations/' + this.organizationId + '/teams', icon: 'fa fa-users', isActive: true },
            { name: 'People', link: '/organizations/' + this.organizationId + '/people', icon: 'fa fa-user' }
        ];

        const configShowing = this.menu[this.menu.length - 1].name == 'Configuration';

        if (!configShowing && this.selectedOrganization && this.selectedOrganization.roles.includes('ADMIN')) {
            this.menu.push({ name: 'Configuration', link: '/organizations/' + this.organizationId + '/configuration', icon: 'fa fa-cogs' });
        }

        this.location.replaceState('/organizations/' + this.organizationId + '/teams');
    }

    get dataCount() {
        return this.data.length;
    }

    onGridReady = (params) => {
        this.gridParams = params;
        this.gridApi = params.api;
        this.gridColumnDefs[2].cellRendererParams = { template: this.descriptionSection };
        this.gridApi.setColumnDefs(this.gridColumnDefs);
        this.getTeams();
    }

    getTeams(): void {
        let roles = [];

        if (this.selectedOrganization?.id) {

            this.showLoadingSpinner = true;

            this.refsetService.getTeams('limit=500&offset=0&sort=name&sortAscending=true&includeMembers=true').subscribe((results) => {

                this.data = [];
                this.teamList = results.items;

                for (const team of this.teamList) {

                    if (team?.organization?.id === this.selectedOrganization?.id) {

                        roles = roles.concat(team.roles);
                        this.data.push({ id: team.id, name: team.name, description: team.description, role: team.roles.sort().join(', ').toLowerCase(), email: team.primaryContactEmail, members: team.members ? team.members.length : '0', memberList: team.memberList });
                    }
                }

                roles = [...new Set(roles)].sort();
                this.gridApi.setRowData(this.data);
                this.showLoadingSpinner = false;
            });
        } else {
            this.data = [];
            this.gridApi.setRowData(this.data);
            this.showLoadingSpinner = false;
        }
    }

    getOrganizations(): void {

        this.refsetService.getOrganizations().subscribe((results) => {

            this.organizationList = results.items;

            for (const organization of this.organizationList) {

                if (this.organizationId === organization.id) {

                    this.setOrganizationData(organization);
                    return;
                }
            }

            this.getStoredOrganizationId();

            if (!this.selectedOrganization) {
                this.showLoadingSpinner = false;
            }
        });
    }

    selectOrganization(): void {

        this.setOrganizationData(this.selectedOrganization);
        this.organizationId = this.selectedOrganization.id;
    }

    setOrganizationData(organization: any) {

        this.organizationId = organization.id;
        this.selectedOrganization = organization;

        localStorage.setItem('selectedOrganizationId', JSON.stringify(this.selectedOrganization.id));

        this.setNavigation();
        this.onGridReady(this.gridParams);
    }

    onGridCellClick = (event) => {
        if (event.column.colId !== 'description') {
            const selectedRows = this.gridApi.getSelectedRows();
            let selectedId: string;

            selectedRows.forEach(function (selectedRow, index) {

                selectedId = selectedRow.id;
            });

            this.router.navigate(['/organization/' + this.organizationId + '/teams/' + selectedId + '/people']);
        }
    }

    getStoredOrganizationId(): void {

        if (localStorage.getItem('selectedOrganizationId')) {

            const storedOrganizationId = JSON.parse(localStorage.getItem('selectedOrganizationId'));

            for (const organization of this.organizationList) {

                if (organization.id == storedOrganizationId) {

                    this.selectedOrganization = organization;
                    this.selectOrganization();
                    return;
                }
            }

            // if the stored organization ID doesn't match anything remove it
            localStorage.removeItem('selectedOrganizationId');
        }
    }
}
