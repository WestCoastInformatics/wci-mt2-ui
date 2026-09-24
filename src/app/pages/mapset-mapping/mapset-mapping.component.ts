import { Subscription } from 'rxjs';
import { ElementRef, Component, EventEmitter, OnInit, Output, TemplateRef, ViewChild } from '@angular/core';
import { formatDate } from '@angular/common';
import { MatSelect } from '@angular/material/select';
import { ActivatedRoute, Router } from '@angular/router';
import { DialogService } from 'src/app/dialog/services/dialog.service';
import { NgbModal, NgbModalRef } from '@ng-bootstrap/ng-bootstrap';
import { RefsetService } from 'src/app/services/rest/refset.service';
import { AuthenticationService } from 'src/app/services/authentication/authentication.service';
import { MT2Service } from 'src/app/services/mt2.service';
import { Title } from '@angular/platform-browser';
import { CodeUtility } from 'src/app/utilities/code.utility';
import { UiUtility } from 'src/app/utilities/ui.utility';
import { BreadcrumbService } from 'src/app/services/breadcrumb.service';
import { Debounce } from 'src/app/decorators/debounce.decorator';
import { User } from 'src/app/models/user';
import { MapWorkflow } from 'src/app/models/map-workflow.model';

@Component({
	standalone: false,
	selector: 'app-mapset-mapping',
	templateUrl: './mapset-mapping.component.html',
	styleUrls: ['./mapset-mapping.component.css'],
})
export class MapsetMappingComponent implements OnInit {
	user!: User;
	userRoles: any[] = [];
	libraryOnly: any;
	searchInput = '';
	viewOptions = [
		{ value: 'all', display: 'All' },
		{ value: 'public', display: 'Public' },
		{ value: 'private', display: 'Private' },
	];
	gridApi: any;
	mapsetData: any[] = [];
	dialog!: DialogService;
	versionStatuses: any;
	versions: any;
	organizations: any;
	showFullNarrativeText = false;
	showFullNotesText = false;
	showLoadingSpinner = false;
	toggleDropdown = false;
	numOfResults = 0;
	directUrl: string | undefined;
	numOfMembers: any;
	disableChannel = new BroadcastChannel('disable-button-channel');
	originalGridParams: any;
	searchCallArray = [];
	uiUtility = UiUtility;
	showLoadingSearch = true;
	toBeDevelopedModalRef!: NgbModalRef;
	downloadModalRef!: NgbModalRef;
	isModalOpen = false;
	isWFMapModalOpen = false;
	mapsetName = 'Mapset Name';
	mapsetCode: string | undefined;
	conceptCode = '';
	mapping: string | undefined;
	routeParamsSubscription$!: Subscription;
	mapsetVersionStorage = 'mapsetVersion';
	gridSelectAll = false;
	internationalId = '449080006';
	loaded = false;
	downloadError = '';
	downloading = false;
	selectedFormat: { value?: string; display?: string } = {};
	formats: { value: string; display: string }[] = [];
	downloadTitle = 'Download';
	mapsetInfo: any = {};
	selectedVersion: any;
	rowColors = [{ background: 'white' }, { background: '#f2f2f2' }];
	currentRowColor = 0;
	moduleMetadata: any;
	editEnabled = false;
	currentStatus = '';
	assignedUser = '';
	workFlowMapStatus = { label: '', value: '', status: '', roles: [''], message: '', notes: '', assign: false, edit: false };
	workFlowMapActions = [{ label: '', value: '', status: '', roles: [''], message: '', notes: '', assign: false, edit: false }];
	reviewMapWF: any;
	mapsetMappingPage: any;

	@Output() loadingSpinner = new EventEmitter<boolean>(true);

	@ViewChild('directoryInfoDialog') infoDialog!: TemplateRef<any>;
	@ViewChild('directoryFeedbackDialog') feedbackDialog!: TemplateRef<any>;
	@ViewChild('directoryActionSection') actionSection!: TemplateRef<any>;
	@ViewChild('downloadModal') downloadModal!: TemplateRef<any>;
	@ViewChild('toBeDevelopedModal') tbdModal!: TemplateRef<any>;
	@ViewChild('actions') private actions!: MatSelect;
	@ViewChild('directorySearchInput') private directorySearchInput!: ElementRef;

	constructor(
		private route: ActivatedRoute,
		private router: Router,
		private titleService: Title,
		private refsetService: RefsetService,
		private mt2Service: MT2Service,
		private breadcrumbService: BreadcrumbService,
		private authenticationService: AuthenticationService,
		private modalService: NgbModal,
	) {
		document.body.scrollTop = 0;
		this.reviewMapWF = MapWorkflow.getWorkFlowForMap();
		this.mapsetMappingPage = this;
	}

	//***** Framework Functions *****/
	ngOnInit() {
		this.user = this.authenticationService.getUser();
		this.userRoles = this.authenticationService.getUserPrimaryRoles();
		this.userRoles = Array.isArray(this.userRoles) ? this.userRoles : [this.userRoles];
		//current status, user role, action
		this.titleService.setTitle('Mapping Tool - Map');
		localStorage.setItem('unsavedChanges', 'false');
		this.routeParamsSubscription$ = this.route.params.subscribe((routeParams) => {
			this.route.url.forEach((part) => {
				part.forEach((value) => {
					if (value.path === 'library') {
						this.libraryOnly = true;
					}
					if (value.path === 'projects') {
						this.libraryOnly = false;
					}
				});
			});
			const prefix = this.libraryOnly ? 'library_' : 'projects_';
			this.mapsetVersionStorage = prefix + this.mapsetVersionStorage;
			this.mapsetCode = routeParams.code;
			this.conceptCode = routeParams.concept;
			this.getMapsetInfo();
			this.getModuleMetadata();
		});
		this.disableChannel.postMessage(false);
	}

	isWorkFlowMapEdit(): boolean {
		const foundEdit = this.workFlowMapActions.filter((wfAction: Record<string, unknown>) => {
			return wfAction.edit === true;
		});
		return foundEdit.length > 0;
	}

	getMapsetInfo() {
		this.refsetService.getMappingWorkflowStatus(this.mapsetCode!, this.conceptCode).subscribe({
			next: (results) => {
				this.currentStatus = results.workflowStatus;
				this.assignedUser = results.assignedUser;
				this.workFlowMapActions = this.reviewMapWF.filter((wf: any) => {
					if (results.workflowStatus !== wf.status) {
						return false;
					}
					return Array.isArray(wf.roles) && wf.roles.some((role: string) => this.userRoles.includes(role));
				});
				this.editEnabled = false;
				const editable = this.isWorkFlowMapEdit();
				if (editable) {
					if (this.assignedUser === this.user?.userName) {
						this.editEnabled = true;
					}
				}
			},
			error: (err) => {
				console.error(' Error: ', err);
				this.authenticationService.checkError(err);
			},
		});

		this.refsetService.getMapsetsByCode(this.mapsetCode!).subscribe(
			(results) => {
				if (results?.length > 0) {
					this.mapsetName = results[0]?.refSetName;
				} else {
					console.error('no mapset found');
					return;
				}
				const mapsetVersions = Array.isArray(results) ? results : [results];

				const getIsInDevelopment = (status: string): boolean => {
					return status === 'IN_DEVELOPMENT' || status === 'IN DEVELOPMENT';
				};

				mapsetVersions.sort((a, b) => {
					const aInDev = getIsInDevelopment(a.versionStatus);
					const bInDev = getIsInDevelopment(b.versionStatus);

					if (aInDev && !bInDev) {
						return -1;
					}
					if (bInDev && !aInDev) {
						return 1;
					}

					const ad = a.versionDate || 0;
					const bd = b.versionDate || 0;
					return bd - ad;
				});

				this.mapsetInfo = mapsetVersions[0];
				const _storedVersion = localStorage.getItem(this.mapsetVersionStorage);

				if (_storedVersion) {
					this.selectedVersion = JSON.parse(_storedVersion);
					const foundVersion = mapsetVersions.filter((v) => {
						const versionDate = v.versionDate || new Date();
						const mapsetVersionStatus = formatDate(versionDate, 'MM-dd-yyyy', 'en-US', 'UTC') + ' (' + v.versionStatus + ') ';
						return mapsetVersionStatus === this.selectedVersion;
					});
					if (foundVersion.length > 0) {
						this.mapsetInfo = foundVersion[0];
					}
				} else {
					const versionDate = this.mapsetInfo.versionDate || new Date();
					this.selectedVersion = formatDate(versionDate, 'MM-dd-yyyy', 'en-US', 'UTC') + ' (' + this.mapsetInfo.versionStatus + ') ';
					localStorage.setItem(this.mapsetVersionStorage, JSON.stringify(this.selectedVersion));
				}
				this.getMapsetData();
			},
			(err) => {
				console.error(' Error: ', err);
				this.authenticationService.checkError(err);
			},
		);
	}

	getModuleMetadata() {
		if (this.mt2Service.moduleMetadata.value?.length === 0) {
			this.refsetService.getMetadata().subscribe({
				next: (results) => {
					this.mt2Service.setModuleMetadata(results);
					this.moduleMetadata = results;
				},
				error: (err) => {
					console.error(' Error: ', err);
					this.authenticationService.checkError(err);
				},
			});
		} else {
			this.moduleMetadata = this.mt2Service.moduleMetadata.value;
		}
	}

	getMapsetData() {
		this.refsetService.getMappingByMapsetConceptList(this.mapsetInfo.id, this.conceptCode || '').subscribe({
			next: (response) => {
				this.loaded = true;
				const data = [];
				let count = 0;
				const results = response.items[0];

				for (let b = 0; b < results.mapEntries.length; b++) {
					let spanned = false;
					if (results.mapEntries.length > 1) {
						if (b >= 1) {
							spanned = true;
						}
					} else {
						results.mapEntries[b].group = '';
					}
					const adviceArray = [];
					for (let i = 0; i < results.mapEntries[b].advices.length; i++) {
						if (results.mapEntries[b].advices[i] !== '') {
							adviceArray.push(results.mapEntries[b].advices[i]);
						}
					}
					data.push({
						index: results.code + count,
						spanned: spanned,
						downloadable: true,
						mapEntries: results.mapEntries,
						descriptions: results.descriptions,
						entries: results.mapEntries.length,
						code: results.code,
						name: results.name,
						toName:
							results.mapEntries[b].toName.length > 0 && results.mapEntries[b].toName !== ' DOES NOT EXIST'
								? results.mapEntries[b].toName
								: '---',
						toCode:
							results.mapEntries[b].toCode.length > 0
								? results.mapEntries[b].group + '/' + results.mapEntries[b].priority + '#' + results.mapEntries[b].toCode
								: 'No map entries available.',
						rule: results.mapEntries[b].rule.length > 0 ? results.mapEntries[b].rule : '---',
						relation: results.mapEntries[b].relation.length > 0 ? results.mapEntries[b].relation : '---',
						modified: results.mapEntries[b].modified,
						advices: { number: adviceArray.length, list: adviceArray },
						group: results.mapEntries[b].group,
						priority: results.mapEntries[b].priority,
						moduleId: results.mapEntries[b].moduleId,
						hasNotes: results.mapNotes?.length > 0 ? true : false,
						modFlag: this.getModuleLanguageIcon(results.mapEntries[b].moduleId),
						modLang: this.getModuleLanguageName(results.mapEntries[b].moduleId),
					});
					count++;
				}

				this.mapsetData = data;

				this.breadcrumbService.setBreadcrumbs([
					{ path: this.libraryOnly ? '/library/' : '/projects/', label: this.libraryOnly ? 'Library' : 'Projects' },
					{
						path: this.libraryOnly
							? '/library' + '/mapset/' + this.mapsetCode + '/mappings'
							: '/projects' + '/mapset/' + this.mapsetCode + '/mappings',
						label: this.mapsetName,
					},
					{ label: this.mapsetData.length > 0 ? this.mapsetData[0]?.name : 'Map' },
				]);
			},
			error: (err) => {
				console.error(' Error: ', err);
				this.authenticationService.checkError(err);
			},
		});
	}

	getModuleLanguageIcon(moduleId: string) {
		let flag = '';
		this.moduleMetadata.module.forEach((data: any) => {
			if (data.id === moduleId) {
				flag = data.countryCode;
			}
		});
		return flag;
	}

	getModuleLanguageName(moduleId: string) {
		let lang = '';
		this.moduleMetadata.module.forEach((data: any) => {
			if (data.id === moduleId) {
				lang = data.name;
			}
		});
		return lang;
	}

	updateNotesStatus(event: any) {
		for (let c = 0; c < this.mapsetData.length; c++) {
			if (this.mapsetData[c].code === event.conceptCode) {
				this.mapsetData[c].hasNotes = event.hasNotes;
			}
		}
	}

	menuOpened() {
		this.directorySearchInput.nativeElement.focus();
	}

	selectAction(action: string) {
		switch (action) {
			case 'edit':
				if (action === 'edit') {
					setTimeout(() => {
						this.goToEditMappingPage();
					}, 2);
				}
				break;
		}
	}

	clearSearch() {
		this.loaded = false;
		if (this.searchInput) {
			this.searchInput = '';
			this.onSearchChange();
		}
	}

	@Debounce()
	onSearchChange() {
		this.searchInput = this.searchInput.trim();
		if (!CodeUtility.hasValue(this.searchInput) || (CodeUtility.hasValue(this.searchInput) && this.searchInput.length > 2)) {
			this.openToBeDevelopedModal(this.tbdModal);
		}
	}

	goToEditMappingPage() {
		this.router.navigate(['/projects/mapset/' + this.mapsetCode + '/mapping/' + this.conceptCode + '/edit'], {
			replaceUrl: false,
			skipLocationChange: false,
		});
	}

	showDropdown(): void {
		this.toggleDropdown = !this.toggleDropdown;
	}

	downloadMapsets() {
		this.downloadTitle = 'Download ' + this.mapsetData[0].code + ' ' + this.mapsetData[0].name;
		this.formats = [{ value: 'tab', display: 'Tab-Delimited Text File' }];
		this.openDownloadModal(this.downloadModal);
	}

	startDownload() {
		this.downloadError = '';
		if (this.selectedFormat['value'] !== undefined) {
			this.downloading = true;
			const cols = ['Source', 'Source PT', 'Target', 'Target PT', 'Relationship', 'Rule', 'Advices', 'Last Modified'];
			const params = {
				conceptCodes: [this.mapsetData[0].code],
				columnNames: cols,
			};
			this.refsetService.exportMapsetByCode(this.mapsetInfo.refSetCode, params).subscribe(
				(data) => {
					this.uiUtility.createMapsetReport(this.mapsetInfo.refSetCode, data);
					this.downloading = false;
					this.closeDownloadModal();
				},
				(err) => {
					console.error(' Error: ', err);
					this.authenticationService.checkError(err);
				},
			);
		} else {
			this.downloadError = 'Please select a download format.';
		}
	}

	openDownloadModal(content: any) {
		this.downloadModalRef = this.modalService.open(content, { centered: true });
		this.isModalOpen = true;
	}

	closeDownloadModal() {
		this.downloadError = '';
		this.selectedFormat = {};
		this.downloadModalRef.close();
		this.isModalOpen = false;
	}

	updateWorkFlowMapStatus(response: any) {
		this.getMapsetInfo();
	}

	closeWorkflowMapModal() {
		this.isWFMapModalOpen = false;
	}

	reviewMapWorkflow(value: string, status: string) {
		this.workFlowMapStatus = this.reviewMapWF.filter((review: any) => {
			return value === review.value && status === review.status;
		})[0];
		this.isWFMapModalOpen = true;
	}

	//***** General Functions *****/

	openToBeDevelopedModal(content: any) {
		this.toBeDevelopedModalRef = this.modalService.open(content, { centered: true });
		this.isModalOpen = true;
	}

	closeToBeDevelopedModal() {
		this.toBeDevelopedModalRef.close();
		this.isModalOpen = false;
	}

	capitalizeFirstLetterOfString(stringValue: string): string {
		if (stringValue) {
			return stringValue.toLowerCase().replace(/(?:^|\s|[-"'([{])+\S/g, (c) => c.toUpperCase());
		}

		return stringValue;
	}

	dateFormatter(val: any): any {
		return UiUtility.dateFormatter(val);
	}

	onResize(event: any) {
		const sectionWidth = $('.section-background').parent().width();
		document.getElementsByClassName('ag-header')[0]?.setAttribute('style', `width: ${sectionWidth}px;`);
		//this.resizeSectionView();
	}
}
