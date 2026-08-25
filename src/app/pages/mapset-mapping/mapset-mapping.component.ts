import { Subscription } from 'rxjs';
import { ElementRef, Component, EventEmitter, OnInit, Output, TemplateRef, ViewChild } from '@angular/core';
import { formatDate } from '@angular/common';
import { MatSelect } from '@angular/material/select';
import { ActivatedRoute, Router } from '@angular/router';
import { DialogService } from 'src/app/dialog/services/dialog.service';
import { NgbModal, NgbModalRef } from '@ng-bootstrap/ng-bootstrap';
import { RefsetService } from 'src/app/services/rest/refset.service';
import { NotificationService } from 'src/app/services/notification.service';
import { AuthenticationService } from 'src/app/services/authentication/authentication.service';
import { MT2Service } from 'src/app/services/mt2.service';
import { Title } from '@angular/platform-browser';
import { CodeUtility } from 'src/app/utilities/code.utility';
import { UiUtility } from 'src/app/utilities/ui.utility';
import { BreadcrumbService } from 'src/app/services/breadcrumb.service';
import { Debounce } from 'src/app/decorators/debounce.decorator';
import { User } from 'src/app/models/user';
import { FormControl } from '@angular/forms';

@Component({
	standalone: false,
	selector: 'app-mapset-mapping',
	templateUrl: './mapset-mapping.component.html',
	styleUrls: ['./mapset-mapping.component.css'],
})
export class MapsetMappingComponent implements OnInit {
	user!: User;
	userRole: string;
	libraryOnly: any;
	searchInput = '';
	viewOptions = [
		{ value: 'all', display: 'All' },
		{ value: 'public', display: 'Public' },
		{ value: 'private', display: 'Private' },
	];
	refsetGridApi: any;
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
	workFlowModalRef!: NgbModalRef;
	isModalOpen = false;
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
	refsetData: any;
	userList: string[] = [];
	selectedUser = '';
	waitingForResponse = false;
	workFlowStatus = { label: '', value: '', status: '', roles: [], message: '', notes: '' };
	workFlowNotesFC = new FormControl('');
	mappingStatus = { current: '', next: [] as string[] };
	reviewWF = [
		{
			label: 'Assign',
			value: 'ASSIGN',
			status: 'NEW',
			roles: ['specialist'],
			message: 'Are you sure you want to assign this mapping?',
			notes: '',
		},
		{
			label: 'Unassign',
			value: 'RELEASE',
			status: 'EDITING_IN_PROGRESS',
			roles: ['specialist'],
			message: 'Are you sure you want to unassign this mapping?',
			notes: '',
		},
		{
			label: 'Finish Editing',
			value: 'FINISH_EDITING',
			status: 'EDITING_IN_PROGRESS',
			roles: ['specialist'],
			message: 'Are you sure you want to finish editing this Mapping?',
			notes: '',
		},
		{
			label: 'Unassign',
			value: 'FORCE_RELEASE',
			status: 'EDITING_IN_PROGRESS',
			roles: ['admin'],
			message: 'Are you sure you want to unassign this mapping?',
			notes: '',
		},
		{
			label: 'Reassign',
			value: 'REASSIGN',
			status: 'EDITING_IN_PROGRESS',
			roles: ['admin', 'lead'],
			message: 'Are you sure you want to reassign this mapping?',
			notes: '',
		},
		{
			label: 'Approve',
			value: 'APPROVE_FOR_PUBLICATION',
			status: 'EDITING_DONE',
			roles: ['lead'],
			message: 'Are you sure you want to approve for publication this mapping?',
			notes: '',
		},
		{
			label: 'Start Review',
			value: 'START_REVIEW',
			status: 'REVIEW_NEEDED',
			roles: ['lead'],
			message: 'Are you sure you want to start reviewing this Mapping?',
			notes: '',
		},
		{
			label: 'Accept Review',
			value: 'ACCEPT_REVIEW',
			status: 'REVIEW_IN_PROGRESS',
			roles: ['lead'],
			message: 'Are you sure you want to accept the review for this Mapping?',
			notes: '',
		},
		{
			label: 'Reject Review',
			value: 'REJECT_REVIEW',
			status: 'REVIEW_IN_PROGRESS',
			roles: ['lead'],
			message: 'Are you sure you want to reject the review for this Mapping?',
			notes: '',
		},
		{
			label: 'Request Revision',
			value: 'REQUEST_REVISION',
			status: 'REVIEW_IN_PROGRESS',
			roles: ['lead'],
			message: 'Are you sure you want to request revision this mapping?',
			notes: '',
		},
		{
			label: 'Approve',
			value: 'APPROVE_FOR_PUBLICATION',
			status: 'REVIEW_RESOLVED',
			roles: ['lead'],
			message: 'Are you sure you want to approve for publication this mapping?',
			notes: '',
		},
		{
			label: 'Start Resolution',
			value: 'START_CONFLICT_RESOLUTION',
			status: 'CONFLICT_DETECTED',
			roles: ['lead'],
			message: 'Are you sure you want to start resolving conflicts for this mapping?',
			notes: '',
		},
		{
			label: 'Resolve Conflict',
			value: 'RESOLVE_CONFLICT',
			status: 'CONFLICT_IN_PROGRESS',
			roles: ['lead'],
			message: 'Are you sure you want to finish resolving conflicts for this mapping?',
			notes: '',
		},
	];

	@Output() loadingSpinner = new EventEmitter<boolean>(true);

	@ViewChild('directoryInfoDialog') infoDialog!: TemplateRef<any>;
	@ViewChild('directoryFeedbackDialog') feedbackDialog!: TemplateRef<any>;
	@ViewChild('directoryActionSection') actionSection!: TemplateRef<any>;
	@ViewChild('workFlowModalNotes') private workflowModalNotes!: ElementRef;
	@ViewChild('workFlowModal') workflowModal!: TemplateRef<any>;
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
		private notificationService: NotificationService,
		private modalService: NgbModal,
	) {
		document.body.scrollTop = 0;
	}

	//***** Framework Functions *****/
	ngOnInit() {
		this.user = this.authenticationService.getUser();
		this.userRole = this.authenticationService.getUserPrimaryRole();
		console.log(' this userRole', this.userRole);
		//current status, user role, action
		this.titleService.setTitle('Mapping Tool - Map');
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

	getMapsetInfo() {
		this.refsetService.getMappingWorkflowStatus(this.mapsetCode!, this.conceptCode).subscribe({
			next: (results) => {
				console.log(' status results', results);
				this.userList = ['devUser'];
				this.selectedUser = '';
				this.mappingStatus.current = results.workflowStatus;
				// this.mappingStatus.next =
				// 	this.reviewWF
				// 		.filter((wf: any) => {
				// 			if (this.mappingStatus.current !== wf.status) {
				// 				return false;
				// 			}
				// 			return Array.isArray(wf.roles) && wf.roles.includes(this.userRole);
				// 		})
				// 		.map((wf: any) => wf.value)[0] ?? '';
				this.mappingStatus.next = [];
				for (const wf of this.reviewWF) {
					if (this.mappingStatus.current === wf.status) {
						if (Array.isArray(wf.roles) && wf.roles.includes(this.userRole)) {
							this.mappingStatus.next.push(wf.value);
						}
					}
				}
				// switch (this.mappingStatus.current) {
				// 	case 'NEW':
				// 		this.mappingStatus.next = 'ASSIGN';
				// 		break;
				// 	case 'ASSIGN':
				// 		this.mappingStatus.next = 'EDITING_IN_PROGRESS';
				// 		break;
				// 	case 'EDITING IN_PROGRESS':
				// 		this.mappingStatus.next = 'FINISH_EDITING';
				// 		break;
				// 	case 'EDITING DONE':
				// 		this.mappingStatus.next = 'START_REVIEW';
				// 		break;
				// 	case 'IN REVIEW':
				// 		this.mappingStatus.next = 'ACCEPT_REVIEW';
				// 		break;
				// 	default:
				// 		this.mappingStatus.next = '';

				// }
				this.mappingStatus.current = this.mappingStatus.current.replace(/_/g, ' ').trim();
				console.log(' this.mappingStatus.', this.mappingStatus);
			},
		});

		this.refsetService.getMapsetsByCode(this.mapsetCode!).subscribe((results) => {
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
			}
			this.getMapsetData();
		});
	}

	getModuleMetadata() {
		if (this.mt2Service.moduleMetadata.value?.length === 0) {
			this.refsetService.getMetadata().subscribe({
				next: (results) => {
					this.mt2Service.setModuleMetadata(results);
					this.moduleMetadata = results;
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
			error: (error) => {
				//
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
					console.error(err);
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

	openWorkFlowModal(content: any) {
		this.workFlowModalRef = this.modalService.open(content, { centered: true });
		this.isModalOpen = true;
		setTimeout(() => {
			this.workflowModalNotes.nativeElement.focus();
		}, 50);
	}

	closeWorkFlowModal() {
		this.workFlowModalRef.close();
		this.isModalOpen = false;
		this.workFlowStatus = { label: '', value: '', status: '', roles: [], message: '', notes: '' };
		this.workFlowNotesFC.setValue('');
		this.workFlowNotesFC.reset();
		this.waitingForResponse = false;
	}

	changeWorkFlowStatus() {
		if (this.workFlowNotesFC.dirty && this.workFlowNotesFC.value) {
			this.workFlowStatus.notes = this.workFlowNotesFC.value;
		}
		this.waitingForResponse = true;
		this.refsetService
			.setMappingWorkflowStatus(this.mapsetInfo.id, this.conceptCode, this.workFlowStatus.value, this.workFlowStatus.notes, this.selectedUser)
			.subscribe((response) => {
				if (response) {
					//this.mapsetInfo = response;
					console.log(' Mapset Info: ', response);
					//this.setWorkflowStatus();
					this.getMapsetInfo();
					this.closeWorkFlowModal();
				}
			});
	}

	reviewWorkflow(status: any) {
		this.workFlowStatus = this.reviewWF.filter((review) => {
			return status === review.value;
		})[0];
		this.openWorkFlowModal(this.workflowModal);
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
