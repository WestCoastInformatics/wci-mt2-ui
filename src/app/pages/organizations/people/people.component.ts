import { Component, OnInit, TemplateRef, ViewChild } from '@angular/core';
import { Location } from '@angular/common';
import { Title } from '@angular/platform-browser';
import { ActivatedRoute, Router } from '@angular/router';
import { lastValueFrom } from 'rxjs';
import { CategoryFilterComponent } from 'src/app/components/categoryFilter/category-filter.component';
import { TemplateRenderer } from 'src/app/components/cellRenderers/template.renderer';
import { CustomTooltipComponent } from 'src/app/components/custom-tooltip/custom-tooltip.component';
import { SidebarMenuItem } from 'src/app/models/sidebar.menu-item.model';
import { BreadcrumbService } from 'src/app/services/breadcrumb.service';
import { OrganizationsService } from 'src/app/services/rest/organizations.service';
import { RefsetService } from 'src/app/services/rest/refset.service';
import { TeamsService } from 'src/app/services/rest/teams.service';
import { UiUtility } from 'src/app/utilities/ui.utility';
import { AuthenticationService } from 'src/app/services/authentication/authentication.service';
import { NgbModal } from '@ng-bootstrap/ng-bootstrap';

@Component({
    selector: 'organization-people',
    templateUrl: './people.component.html'
})
export class OrganizationPeopleComponent implements OnInit {

    menu: SidebarMenuItem[] = [];
    data = [];
    showTable = false;
    defaultColDef = {};
    peopleList = [];
    selectedOrganization: any;
    organizationId: any;
    organizationList = [];
    gridOptions: any;
    gridPaging = { pageSize: 10, pageSizeOptions: [10, 25, 50, 100], totalKnown: false, totalRows: null, manualStateRefresh: new Boolean(true) };
    gridParams: any;
    gridApi: any;
    gridColumnDefs = [];
    showLoadingSpinner = true;
    uiUtility = UiUtility;
    openedConfirmModal: any;
    selectedUser: any;

    @ViewChild('peopleNameSection') peopleNameSection: TemplateRef<any>;
    @ViewChild('peopleTeamsSection') peopleTeamsSection: TemplateRef<any>;
    @ViewChild('inactivateUserSection') inactivateUserSection: TemplateRef<any>;
    @ViewChild('confirmInactiveMemberModal') confirmInactiveMemberModal: NgbModal;

    constructor(private readonly breadcrumbService: BreadcrumbService,
        private readonly titleService: Title,
        private readonly refsetService: RefsetService,
        private readonly organizationsService: OrganizationsService,
        private readonly route: ActivatedRoute,
        private readonly router: Router,
        private readonly teamService: TeamsService,
        private readonly modalService: NgbModal,
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
    }

    ngAfterViewInit() {

        this.gridColumnDefs = [
            { field: 'name', headerName: 'Members', minWidth: 300, flex: 1, cellRenderer: 'templateRenderer', cellRendererParams: { template: this.peopleNameSection }, unSortIcon: true },
            { field: 'company', flex: 1, headerName: 'Company Name', unSortIcon: true },
            { field: 'email', minWidth: 400, headerName: 'Email', unSortIcon: true },
            { field: 'teams', tooltipComponentFramework: CustomTooltipComponent, tooltipField: 'teams', tooltipComponentParams: { color: '#ececec' }, flex: 1, headerName: 'Teams', filter: false, sortable: false, cellRenderer: 'templateRenderer', cellRendererParams: { template: this.peopleTeamsSection } },
            {
                field: 'id', type: 'centerAligned', tooltipField: 'inactiveCode', headerName: 'Inactivate Member', cellClass: 'column-inactiveOrgMember', cellRenderer: 'templateRenderer', cellStyle: { textAlign: 'center' }, floatingFilter: false, sortable: false, cellRendererParams: {
                    template: this.inactivateUserSection
                }, flex: 1, maxWidth: 190, resizable: false
            },
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
                templateRenderer: TemplateRenderer,
                'categoryFilterComponent': CategoryFilterComponent
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
        };

        this.data = [];
    }

    setNavigation() {

        this.breadcrumbService.setBreadcrumbs([
            { path: '/dashboard', label: 'Dashboard' },
            { label: 'Organization People' },
        ]);

        this.menu = [
            { name: 'Projects', link: '/organizations/' + this.organizationId + '/edition/0/projects', icon: 'fa fa-folder-open' },
            { name: 'Teams', link: '/organizations/' + this.organizationId + '/teams', icon: 'fa fa-users' },
            { name: 'People', link: '/organizations/' + this.organizationId + '/people', icon: 'fa fa-user', isActive: true }
        ];

        const configShowing = this.menu[this.menu.length - 1].name == 'Configuration';

        if (!configShowing && this.selectedOrganization && this.selectedOrganization.roles.includes('ADMIN')) {
            this.menu.push({ name: 'Configuration', link: '/organizations/' + this.organizationId + '/configuration', icon: 'fa fa-cogs' });
        }

        this.location.replaceState('organizations/' + this.organizationId + '/people/');
    }

    onGridReady = (params) => {

        this.gridParams = params;
        this.gridApi = params.api;
        this.gridApi.setRowData(this.data);
    }

    onGridCellClick = (event) => {
        if (event.column.colId == 'id') {
            return;
        }

        const selectedRows = this.gridApi.getSelectedRows();
        let selectedId: string;

        selectedRows.forEach(function (selectedRow, index) {

            selectedId = selectedRow.id;
        });

        this.router.navigate(['/personal/' + selectedId + '/landing']);
    }

    get dataCount() {
        return this.data.length;
    }

    getPeople(): void {
        console.log('hit')
        this.showLoadingSpinner = true;
        this.organizationsService.getOrgUsers(this.organizationId, true).subscribe((results) => {

            this.data = results.items;
            this.showTable = true;
            this.showLoadingSpinner = false;
        });
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

        sessionStorage.setItem('selectedOrganizationId', JSON.stringify(this.selectedOrganization.id));

        this.setNavigation();
        this.getPeople();
    }

    async getTeams(teams: any): Promise<any> {
        console.log(teams);
        const teamObject = { teams: [] };
        if (teams === 'undefined' || teams === undefined) {
            return JSON.stringify(teamObject);
        } else {
            for (const team of teams) {
                teamObject.teams.push(await lastValueFrom(this.teamService.getTeam(team)));
            }
            return JSON.stringify(teamObject);
        }
    }

    confirmRemoveUser(user) {
        this.selectedUser = user;
        this.openedConfirmModal = this.modalService.open(this.confirmInactiveMemberModal, { centered: true });
    }

    removeUser() {
        this.organizationsService.removeUser(this.organizationId, this.selectedUser.id).subscribe({
            next: (data) => {
                const datum = data;
                console.log(datum);
            },
            complete: () => window.location.reload()
        });
    }

    getTeamCount(teams: any): number {
        return teams.length;
    }

    getTeamsTitle(data: any): string {
        return data?.teams.map(t => t.name).join(', ');
    }

    getStoredOrganizationId(): void {

        if (sessionStorage.getItem('selectedOrganizationId')) {

            const storedOrganizationId = JSON.parse(sessionStorage.getItem('selectedOrganizationId'));

            for (const organization of this.organizationList) {

                if (organization.id == storedOrganizationId) {

                    this.selectedOrganization = organization;
                    this.selectOrganization();
                    return;
                }
            }

            // if the stored organization ID doesn't match anything remove it
            sessionStorage.removeItem('selectedOrganizationId');
        }
    }
}
