import { Component, OnDestroy, OnInit, TemplateRef, ViewChild } from '@angular/core';
import { Title } from '@angular/platform-browser';
import { ActivatedRoute, Router } from '@angular/router';
import { lastValueFrom, Subscription, concatMap } from 'rxjs';
import { RefsetService } from 'src/app/services/rest/refset.service';
import { ProjectsService } from 'src/app/services/rest/projects.service';
import { NotificationService } from 'src/app/services/notification.service';
import { TemplateRendererComponent } from 'src/app/components/cellRenderers/template.renderer';
import { OrganizationsComponentService } from 'src/app/pages/organizations/organizations-component.service';

@Component({
	selector: 'organization-projects',
	templateUrl: './projects.component.html',
})
export class OrganizationProjectsComponent implements OnInit, OnDestroy {
	routerParamsSubscription: Subscription;
	routerEventSubscription: Subscription;
	data = [];
	gridOptions: any;
	@ViewChild('descriptionSection') descriptionSection: TemplateRef<any>;
	@ViewChild('teamSection') teamSection: TemplateRef<any>;
	columnDefs = [];
	projectList: any[] = [];
	organizationList: any[] = [];
	organizationSubscription: Subscription;
	selectedOrganization: any;
	organizationId: string;
	editionId: any;
	selectedEdition: any;
	editionList: any[] = [];
	editionSubscription: Subscription;
	api: any;
	columnApi: any;
	gridParams: any;
	showLoadingSpinner = false;
	currentURL: string;
	previouslyLoadedId: string;

	constructor(
		private readonly titleService: Title,
		private readonly refsetService: RefsetService,
		private readonly router: Router,
		private readonly route: ActivatedRoute,
		private readonly projectsService: ProjectsService,
		private readonly notificationService: NotificationService,
		private readonly organizationsComponentService: OrganizationsComponentService
	) {
		document.body.scrollTop = 0;
	}

	ngOnInit(): void {
		this.titleService.setTitle('Reference Set Tool - Organizations');

		this.routerParamsSubscription = this.route.params.subscribe((params) => {
			this.organizationId = params['organizationId'];
			this.editionId = params['editionId'];
		});

		this.routerEventSubscription = this.router.events.subscribe((event) => {
			if (this.router.url.includes('projects')) {
				this.checkLocationPath(this.router.url);
			} else {
				this.ngOnDestroy();
			}
		});
		this.buildGrid();
	}

	buildGrid(): void {
		this.columnDefs = [
			{
				field: 'name',
				tooltipField: 'name',
				headerName: 'Project Name',
				flex: 1,
				minWidth: 65,
				cellRenderer: (params) => `${params.data.name}` + (params.data.locked ? '<i class="ml-3 text-muted fa fa-lock"></i>' : ''),
				cellClass: 'pointer',
				unSortIcon: true,
				resizable: true,
			},
			{
				field: 'description',
				tooltipField: 'description',
				headerName: 'Description',
				flex: 2,
				minWidth: 65,
				cellRenderer: 'templateRenderer',
				cellRendererParams: { template: this.descriptionSection },
				unSortIcon: true,
				resizable: true,
			},
			{
				field: 'teams',
				headerName: 'Teams',
				filter: false,
				minWidth: 65,
				resizable: false,
				sortable: false,
				cellRenderer: 'templateRenderer',
				cellRendererParams: { template: this.teamSection },
			},
		];

		this.gridOptions = {
			onCellClicked: this.onGridCellClick,
			onGridReady: this.onGridReady,
			frameworkComponents: {
				'templateRenderer': TemplateRendererComponent,
			},
			defaultColDef: {
				filter: true,
				suppressMenu: true,
				floatingFilter: true,
				unSortIcon: true,
				sortable: true,
				resizable: true,
			},
		};

		this.data = [];
		this.getOrganizations();
	}

	checkLocationPath(url) {
		if (this.currentURL != url) {
			this.currentURL = url;
			if (url.includes('organizations') || url.includes('organization')) {
				const parts = url.split('/');
				for (let p = 0; p < parts.length; p++) {
					if (parts[p].includes('organizations') || parts[p].includes('organization')) {
						if (parts[p + 1] != undefined) {
							this.organizationId = parts[p + 1];
						}
					}
					if (parts[p].includes('edition')) {
						if (parts[p + 1] != undefined) {
							this.editionId = parts[p + 1];
						}
					}
				}
			}
			if (this.organizationId) {
				if (this.api) {
					this.api.showLoadingOverlay();
					this.data = [];
					this.editionList = [];
					this.projectList = [];
					this.getOrganizations();
				}
			}
		}
	}

	onGridReady = (params) => {
		this.gridParams = params;
		if (params?.api) {
			this.api = params.api;
			this.columnApi = params.columnApi;
			this.api.showLoadingOverlay();
			// BAC: these are here because column defs are set up before view children are injected?
			this.columnDefs[1].cellRendererParams = { template: this.descriptionSection };
			this.columnDefs[2].cellRendererParams = { template: this.teamSection };
			this.api.setColumnDefs(this.columnDefs);
		}
	};

	onGridCellClick = (event) => {
		// If clicking on teams, go to teams page
		if (event.column.colId === 'teams') {
			this.router.navigate(['organization', this.organizationId, 'edition', this.editionId, 'projects', event.data.id, 'teams'], { replaceUrl: false, skipLocationChange: false });
		} else {
			this.router.navigate(['organization', this.organizationId, 'edition', this.editionId, 'projects', event.data.id, 'refsets'], { replaceUrl: false, skipLocationChange: false });
		}
	};

	get dataCount() {
		return this.data.length;
	}

	getProjects(): void {
		if (this.editionId != this.previouslyLoadedId) {
			this.previouslyLoadedId = this.editionId;

			if (this.api) {
				this.api.showLoadingOverlay();
			}
			if (this.editionId == undefined) {
				this.notificationService.show('No projects', null, 'error', {
					timeOut: 1500,
					extendedTimeOut: 0,
				});
				this.showLoadingSpinner = false;
				this.api.setRowData([]);
				this.api.redrawRows();
				return;
			}

			this.showLoadingSpinner = true;
			this.refsetService
				.getProjects('query=editionId:' + this.editionId + '&sort=name&sortAscending=true')
				.pipe(
					concatMap(async (results) => {
						this.data = [];
						const loadData = [];
						this.projectList = results.items;

						for (const project of this.projectList) {
							loadData.push({
								name: `${project?.name}`,
								locked: project?.privateProject,
								description: `${project?.description}`,
								teamlist: `${await this.getTeams(project?.id)}`,
								id: project.id,
							});
						}
						this.data = loadData;
						this.api.setRowData(this.data);
						this.api.redrawRows();
						this.showLoadingSpinner = false;
					})
				)
				.subscribe((error) => {
					this.showLoadingSpinner = false;
				});
		}
	}

	async getTeams(projectId: any): Promise<any> {
		const teamObject = { teams: [] };

		if (projectId === 'undefined' || projectId === undefined) {
			return JSON.stringify(teamObject);
		} else {
			teamObject.teams.push(await lastValueFrom(this.projectsService.getProjectTeams(projectId)));
			return JSON.stringify(teamObject);
		}
	}

	getTeamCount(data: any): number {
		if (data && data.teamlist) {
			const teams = JSON.parse(data.teamlist).teams[0];
			return teams.total;
		} else {
			return 0;
		}
	}

	getTeamsTitle(data: any): string {
		if (data && data.teamlist) {
			const teamData = JSON.parse(data.teamlist).teams[0];
			const teams = teamData.items;
			if (teams.length > 0) {
				return 'Organization Teams:\n' + teams.map((t) => t.name).join(', \n');
			}
			return 'No Organization Teams';
		}
		return 'No teams';
	}

	getOrganizations(): void {
		const organization_id = this.organizationId;
		this.organizationSubscription = this.organizationsComponentService.getOrganizations().subscribe((results) => {
			this.organizationList = <any>results;

			for (const organization of this.organizationList) {
				if (organization_id === organization.id) {
					this.selectedOrganization = organization;
					this.selectOrganization();
					return;
				}
			}
		});
	}

	selectOrganization(): void {
		this.organizationId = this.selectedOrganization.id;
		this.setOrganizationData(this.selectedOrganization);
		this.selectedEdition = null;
		this.editionList = [];
		this.getEditions();
	}

	setOrganizationData(organization: any) {
		this.organizationId = organization.id;

		localStorage.setItem('selectedOrganizationId', JSON.stringify(this.selectedOrganization.id));
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
	getEditions(): void {
		const edition_id = this.editionId;
		this.editionSubscription = this.organizationsComponentService.getEditions().subscribe({
			next: (results) => {
				this.editionList = <any>results;

				for (const edition of this.editionList) {
					if (edition_id == edition.id) {
						this.selectedEdition = edition;
						this.selectEdition();
						return;
					}
				}
				if (!this.selectedEdition) {
					// Pick the first one if nothing is working out
					if (this.editionList[0] != undefined) {
						this.selectedEdition = this.editionList[0];
						this.selectedEdition.id = this.editionList[0].id;
						this.selectEdition();
					} else {
						this.editionId = 0;
					}
				}
			},
			error: (error) => {
				this.showLoadingSpinner = false;
			},
		});
	}

	selectEdition(): void {
		this.editionId = this.selectedEdition.id;

		if (this.editionId !== undefined) {
			this.getProjects();
		}
	}

	ngOnDestroy() {
		if (this.routerParamsSubscription) {
			this.routerParamsSubscription.unsubscribe();
		}
		if (this.routerEventSubscription) {
			this.routerEventSubscription.unsubscribe();
		}
		if (this.organizationSubscription) {
			this.organizationSubscription.unsubscribe();
		}

		if (this.editionSubscription) {
			this.editionSubscription.unsubscribe();
		}
	}
}
