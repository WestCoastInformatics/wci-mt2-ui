import { Component, OnInit, TemplateRef, ViewChild } from '@angular/core';
import { Title } from '@angular/platform-browser';
import { ActivatedRoute, Router } from '@angular/router';
import { CategoryFilterComponent } from 'src/app/components/categoryFilter/category-filter.component';
import { TemplateRenderer } from 'src/app/components/cellRenderers/template.renderer';
import { CustomTooltipComponent } from 'src/app/components/custom-tooltip/custom-tooltip.component';
import { SidebarMenuItem } from 'src/app/models/sidebar.menu-item.model';
import { AuthenticationService } from 'src/app/services/authentication/authentication.service';
import { BreadcrumbService } from 'src/app/services/breadcrumb.service';
import { RefsetService } from 'src/app/services/rest/refset.service';
import { TeamsService } from 'src/app/services/rest/teams.service';
import { CodeUtility } from 'src/app/utilities/code.utility';
import { UiUtility } from 'src/app/utilities/ui.utility';
import { Location } from '@angular/common';
import {NgbModal} from '@ng-bootstrap/ng-bootstrap';
import {User} from '../../../models/user';

@Component({
    selector: 'teams-people',
    templateUrl: './people.component.html'
})
export class TeamsPeopleComponent implements OnInit {

    menu: SidebarMenuItem[] = [];
    data = [];
    defaultColDef = {};
    selectedTeam: any;
    teamId: any;
    teamList = [];
    currentUser: any;
    gridOptions: any;
    gridPaging = { pageSize: 10, pageSizeOptions: [10, 25, 50, 100], totalKnown: false, totalRows: null, manualStateRefresh: true };
    gridParams: any;
    gridApi: any;
    gridColumnDefs = [];
    peopleList = [];
    showTable = false;
    organizationList = [];
    organizationId: string;
    selectedOrganization: any;
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
        private readonly route: ActivatedRoute,
        private readonly router: Router,
        private readonly authService: AuthenticationService,
        private readonly teamsService: TeamsService,
        private readonly modalService: NgbModal,
        private location: Location) {
        document.body.scrollTop = 0;
    }

    ngOnInit(): void {

        this.titleService.setTitle('Refset Tool - Teams');
        this.currentUser = this.authService.getUser();
        this.route.params.subscribe(params => {

            this.organizationId = params['organizationId'];
            this.teamId = params['id'];
            this.setNavigation();
        });

        this.data = [];
        this.selectedOrganization = null;
        this.selectedTeam = null;

        this.getOrganizations();
    }

    ngAfterViewInit() {

        this.gridColumnDefs = [
            { field: 'name', headerName: 'Members', minWidth: 300, flex: 1, cellRenderer: 'templateRenderer', cellRendererParams: { template: this.peopleNameSection } },
            { field: 'company', flex: 1, headerName: 'Company Name' },
            { field: 'email', flex: 1, headerName: 'Email' },
            { field: 'teams', tooltipComponentFramework: CustomTooltipComponent, tooltipField: 'teams', tooltipComponentParams: { color: '#ececec' }, flex: 1, headerName: 'Teams', filter: false, sortable: false, cellRenderer: 'templateRenderer', cellRendererParams: { template: this.peopleTeamsSection } },
            {
                field: 'id', tooltipField: 'inactiveCode', headerName: 'Inactivate Member', cellClass: 'column-inactiveTeamMember', cellRenderer: 'templateRenderer', cellStyle: { textAlign: 'center' }, floatingFilter: false, sortable: false, cellRendererParams: {
                    template: this.inactivateUserSection
                }, flex: 1, maxWidth: 225
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
                templateRenderer: TemplateRenderer,
                'categoryFilterComponent': CategoryFilterComponent
            },
            defaultColDef: {
                sortable: true,
                resizable: true,
                suppressMenu: true,
                filter: true,
                floatingFilter: true,
                floatingFilterComponentParams: { placeholder: '', suppressFilterButton: true },
                unSortIcon: true
            },
            enableBrowserTooltips: true,
        };
    }

    setNavigation() {

        const breadcrumbs: any = [{ path: '/dashboard', label: 'Dashboard' }];

        if (CodeUtility.hasValue(this.organizationId), true, true) {
            breadcrumbs.push({ path: 'organizations/teams/' + this.organizationId, label: 'Organization Teams' });
        }

        breadcrumbs.push({ label: 'People' });
        this.breadcrumbService.setBreadcrumbs(breadcrumbs);

        this.menu = [
            { name: 'People', link: '/organization/' + this.organizationId + '/teams/people', icon: 'fa fa-user', isActive: true }
        ];
    }

    getOrganizations() {

        this.refsetService.getOrganizations().subscribe((results) => {

            this.showLoadingSpinner = false;
            this.showTable = true;
            this.organizationList = results.items;

            for (const organization of this.organizationList) {

                if (this.organizationId == organization.id) {

                    this.selectedOrganization = organization;
                    this.getTeams();
                    break;
                }
            }
        });
    }

    selectOrganization(): void {

        this.organizationId = this.selectedOrganization.id;
        this.location.replaceState('organization/' + this.organizationId + '/teams/people/');
        this.teamId = null;
        this.selectedTeam = null;
        this.teamList = [];
        this.data = [];

        this.getTeams();
    }

    getTeams(): void {

        this.refsetService.getTeams('includeMembers=true&query=organizationId:' + this.selectedOrganization.id + '&limit=500&offset=0&sort=name&sortAscending=true').subscribe((results) => {

            this.teamList = results.items;

            for (const team of this.teamList) {

                if (this.teamId == team.id) {

                    this.selectedTeam = team;
                    this.showTeamMembers();
                }
            }
        });
    }

    selectTeam($event): void {

        this.teamId = this.selectedTeam.id;
        this.location.replaceState('organization/' + this.organizationId + '/teams/people/' + this.selectedTeam.id);
        this.showTeamMembers();
    }

    showTeamMembers() {

        this.data = this.selectedTeam.memberList;

        const configShowing = this.menu[this.menu.length - 1].name == 'Configuration';

        if (!configShowing && this.selectedOrganization.roles.includes('ADMIN')) {
            this.menu.push({ name: 'Configuration', link: '/organization/' + this.organizationId + '/teams/configuration', icon: 'fa fa-cogs' });

        }
    }

    onGridReady = (params) => {

        this.gridParams = params;
        this.gridApi = params.api;
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

        this.router.navigate(['/personal/landing', selectedId]);
    }

    get dataCount() {

        if (this.data) {
            return this.data.length;
        } else {
            return 0;
        }
    }

    confirmRemoveUser(user) {
        this.selectedUser = user;
        this.openedConfirmModal = this.modalService.open(this.confirmInactiveMemberModal, { centered: true });
    }
    removeUser() {
        this.teamsService.removeUser(this.teamId, this.selectedUser.id).subscribe({
            next: (data) => {
                console.log(data);
            },
            complete: () => window.location.reload()
        });
    }

    getTeamCount(data: any): number {
        return data.teams.length;
    }

}
