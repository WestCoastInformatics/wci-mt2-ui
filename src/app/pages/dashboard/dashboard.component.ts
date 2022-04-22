import { Component, OnInit } from '@angular/core';
import { Title } from '@angular/platform-browser';
import { ActivatedRoute, Router } from '@angular/router';
import { AuthenticationService } from 'src/app/services/authentication/authentication.service';
import { BreadcrumbService } from 'src/app/services/breadcrumb.service';
import { RefsetService } from 'src/app/services/rest/refset.service';
import { RefsetUtility } from 'src/app/utilities/refset.utility';
import { UiUtility } from 'src/app/utilities/ui.utility';

@Component({
    selector: 'app-dashboard',
    templateUrl: './dashboard.component.html'
})
export class DashboardComponent implements OnInit {
    searchText = '';
    organizationList = [];
    projectList = [];
    teamList = [];
    currentUser: any;

    columnDefs = [
        { field: 'refsetName', headerName: 'Reference Set', flex: 1, minWidth: 550, unSortIcon: true, sortable: true, cellClass:'pointer' },
        { field: 'workflowStatus', headerName: 'Workflow Status', unSortIcon: true, sortable: true },
        {
            field: 'modified', tooltipField: 'modified', headerName: 'Last Modified', unSortIcon: true, sortable: true, valueGetter:
                UiUtility.gridDateValueGetter,
        }
    ];

    data = [];
    api: any;
    columnApi: any;
    refsetGridOptions: any;

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
        this.getOrganizations();
        this.getProjects();
        this.getTeams();
    }

    ngAfterViewInit() {

        
    }


    onGridReady = (params) => {
        this.api = params.api;
        this.columnApi = params.columnApi;
        this.getRefSets();
    }

    onGridCellClick = (event) => {
        if (event.column.colId === 'refsetName') {
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
            console.log(this.organizationList);
        });
    }

    getRefSets(): void {
        this.refsetService.getRefsets(`limit=500&offset=0&sort=name&sortAscending=true&assignedUser=${this.currentUser.userName}`, false).subscribe((x) => {
            for (let refset of x.items) {
                this.data.push({ refsetName: `${refset?.organizationName}/${refset?.project?.name}/${refset.name}`
                , refsetId: refset.refsetId 
                , workflowStatus: `${refset?.workflowStatus}`
                , modified: `${refset?.modified}`, versionStatus: `${refset.versionStatus}`, versionDate: `${refset.versionDate}` })
                if (refset.assignedUser === this.currentUser.userName) {
                    
                }
            }
            console.log(this.data)
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
            this.teamList = results.items.filter((x) => {
                return x.members.some((member) => {
                    return member.includes(this.currentUser.id);
                });
            });
        });
    }
}
