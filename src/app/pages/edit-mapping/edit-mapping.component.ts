import { FormControl } from '@angular/forms';
import {
	ChangeDetectorRef,
	ElementRef,
	Component,
	EventEmitter,
	OnInit,
	Output,
	TemplateRef,
	ViewChild,
	HostListener,
	Renderer2,
} from '@angular/core';
import { PaginationChangedEvent } from 'ag-grid-community';
import { Subscription, Observable, OperatorFunction, of, map } from 'rxjs';
import { debounceTime, distinctUntilChanged, switchMap } from 'rxjs/operators';
import { MatSelect } from '@angular/material/select';
import { ActivatedRoute, Router } from '@angular/router';
import { CodeUtility } from 'src/app/utilities/code.utility';
import { CdkDragDrop } from '@angular/cdk/drag-drop';
import { DialogService } from 'src/app/dialog/services/dialog.service';
import { NotificationService } from 'src/app/services/notification.service';
import { NgbModal, NgbModalRef } from '@ng-bootstrap/ng-bootstrap';
import { RefsetService } from 'src/app/services/rest/refset.service';
import { MT2Service } from 'src/app/services/mt2.service';
import { Title } from '@angular/platform-browser';
import { UiUtility } from 'src/app/utilities/ui.utility';
import { environment } from '../../../environments/environment';
import { BreadcrumbService } from 'src/app/services/breadcrumb.service';
import { TemplateRendererComponent } from 'src/app/components/cellRenderers/template.renderer';
import { Debounce } from 'src/app/decorators/debounce.decorator';
import { User } from 'src/app/models/user';
import { AuthenticationService } from 'src/app/services/authentication/authentication.service';
import { PaginationService } from 'src/app/services/pagination.service';

@Component({
	standalone: false,
	selector: 'app-edit-mapping',
	templateUrl: './edit-mapping.component.html',
	styleUrls: ['./edit-mapping.component.css'],
})
export class EditMappingComponent implements OnInit {
	user: User;
	targetCodeInput = '';
	targetNameInput = '';
	ruleBased = false;
	targetTerminology = '';
	targetTerminologyVersion = '';
	searchBrowserInput = '';
	mapRelations = [];
	targetRelations = [];
	noTargetRelations = [];
	projectRelations = [];
	mapAdvices = [];
	updateAdviceList = [];
	viewOptions = [
		{ value: 'all', display: 'All' },
		{ value: 'public', display: 'Public' },
		{ value: 'private', display: 'Private' },
	];
	selectedView = 'all';
	selectedBrowser = '';
	refsetGridApi: any;
	columnDefs = [];
	refsetGridColumns = [
		{ name: 'information', show: true },
		{ name: 'refsetId', show: true },
	];
	rowSelection = 'multiple';
	refsetGridOptions: any;
	refsetGridPaging = {
		pageSize: 10,
		pageSizeOptions: [10, 25, 50, 100],
		totalKnown: false,
		totalRows: null,
		manualStateRefresh: Boolean(true),
	};
	refsetGridLastFilter = '';
	refsetGridLastSort = '';
	showTable = false;
	mapsetData = [];
	dialog: DialogService;
	versionStatuses: any;
	versions: any;
	organizations: any;
	initialGridWidth: number;
	showFullNarrativeText = false;
	showFullNotesText = false;
	showLoadingSpinner = false;
	toggleDropdown = false;
	numOfResults = 0;
	directUrl: string;
	numOfMembers: any;
	disableChannel = new BroadcastChannel('disable-button-channel');
	originalGridParams: any;
	searchCallArray = [];
	uiUtility = UiUtility;
	showLoadingSearch = true;
	toBeDevelopedModalRef: NgbModalRef;
	confirmModalRef: NgbModalRef;
	isModalOpen = false;
	mapsetName = 'Mapset Name';
	selectedMapset: any;
	showConfigSection = true;
	showBrowserSection = false;
	mapsetCode: string;
	mapsetInfo: any = {};
	conceptCode: string;
	mapping: string;
	routeParamsSubscription$: Subscription;
	browserSubscription: Subscription;
	gridSelectAll = false;
	advicePopoverLocation = 0;
	removeId: any;
	removeType: string;
	loaded = false;
	loadError = false;
	showPaging = false;
	browserLoaded = false;
	selectedFormat = {};
	formats = [];
	numOfGroups = 0;
	groupList = [];
	foundConceptCode = false;
	selectedTarget = { id: '', group: 0, priority: 0 };
	userChanged = false;
	internationalId = '449080006';
	tempModuleIdChangeBeforeRelease = '449080006';

	targetFC = new FormControl('a');
	groupFC = new FormControl('');

	public query: any;
	//formatter = (result: any) => result || this.query;
	formatter = (x: { name: string; code: string }) => x.code;
	searchByKeyboard = false;
	searchByTypeahead = false;
	rowColors = [{ background: 'white' }, { background: '#f2f2f2' }];
	currentRowColor = 0;
	stepperInfo: any = {};
	stepperStartInfo = {
		READY_FOR_EDIT_COLOR: 'details-page-stepper-unstarted-step',
		READY_FOR_EDIT_STARTED: false,
		READY_FOR_REVIEW_COLOR: 'details-page-stepper-unstarted-step',
		READY_FOR_REVIEW_STARTED: false,
		REVIEW_COMPLETED_COLOR: 'details-page-stepper-unstarted-step',
		REVIEW_COMPLETED_STARTED: false,
		READY_FOR_PUBLICATION_COLOR: 'details-page-stepper-unstarted-step',
		READY_FOR_PUBLICATION_STARTED: false,
		PUBLISHED_COLOR: 'details-page-stepper-unstarted-step',
		PUBLISHED_STARTED: false,
		IN_EDIT_COLOR: 'details-page-stepper-unstarted-step',
		IN_EDIT_STARTED: false,
		IN_REVIEW_COLOR: 'details-page-stepper-unstarted-step',
		IN_REVIEW_STARTED: false,
		IN_PUBLICATION_COLOR: 'details-page-stepper-unstarted-step',
		IN_PUBLICATION_STARTED: false,
		IN_UPGRADE_COLOR: 'details-page-stepper-unstarted-step',
		IN_UPGRADE_STARTED: false,
	};

	moduleMetadata: any;
	refsetData: any;
	loadedBrowser = false;
	isNewPageSize = false;
	paginationPages: any = {};
	browserData = [];
	browserOptions: any;
	browserPaging = { pageSize: 10, pageSizeOptions: [10, 25, 50, 100], totalKnown: false, totalRows: null, manualStateRefresh: true };
	browserParams: any;
	browserApi: any;
	browserColumnDefs = [];
	conceptDetail = false;
	currentConcept: any;

	@Output() loadingSpinner = new EventEmitter<boolean>(true);

	@ViewChild('directoryInfoDialog') infoDialog: TemplateRef<any>;
	@ViewChild('directoryFeedbackDialog') feedbackDialog: TemplateRef<any>;
	@ViewChild('directoryActionSection') actionSection: TemplateRef<any>;
	@ViewChild('confirmationModal') confirmationModal: TemplateRef<any>;
	@ViewChild('toBeDevelopedModal') tbdModal: TemplateRef<any>;
	@ViewChild('browserSearchInput') private browserSearchInput: ElementRef;
	@ViewChild('actions') private actions: MatSelect;
	@ViewChild('selectRelationship') private selectRelationship: MatSelect;
	@ViewChild('selectRule') private selectRule: MatSelect;
	@ViewChild('selectAdvice') private selectAdvice: MatSelect;
	@ViewChild('groupInput') private groupInput: ElementRef;
	@ViewChild('targetInput') private targetInput: ElementRef;
	@ViewChild('secondWindow') secondWindow: ElementRef;

	constructor(
		private route: ActivatedRoute,
		private router: Router,
		private titleService: Title,
		private refsetService: RefsetService,
		private mt2Service: MT2Service,
		private renderer: Renderer2,
		private elementRef: ElementRef,
		private changeDetectorRef: ChangeDetectorRef,
		private breadcrumbService: BreadcrumbService,
		private authenticationService: AuthenticationService,
		private notificationService: NotificationService,
		private modalService: NgbModal,
		private pagerService: PaginationService,
	) {
		document.body.scrollTop = 0;
		this.targetFC.valueChanges.pipe(debounceTime(600), distinctUntilChanged()).subscribe((res) => {
			if (this.targetFC.dirty && !this.searchByTypeahead) {
				this.foundConceptCode = false;
				this.targetNameInput = '';
				if (this.targetFC.value.length >= 2) {
					this.onInputTargetChange();
				}
			} else {
				this.searchByTypeahead = false;
			}
		});
	}

	//***** Framework Functions *****/
	ngOnInit() {
		this.user = this.authenticationService.getUser();
		this.titleService.setTitle('Mapping Tool - Edit Map');
		this.routeParamsSubscription$ = this.route.params.subscribe((routeParams) => {
			this.mapsetCode = routeParams.code;
			this.conceptCode = routeParams.concept;
			this.getMapsetData();
			this.getMapsetInfo();
			this.getModuleMetadata();
			this.getMapProject();
			this.firstLoadBrowser();
		});
		this.formats = [
			{ value: 'rf2', display: 'RF2' },
			{ value: 'sctids', display: 'List Of SCTIDs' },
		];

		if (this.authenticationService.getUser().userName != this.authenticationService.GUEST_USER) {
			this.formats.splice(1, 0, { value: 'rf2_with_names', display: 'RF2 With Names' });
		}

		if (this.authenticationService.getUser().userName != this.authenticationService.GUEST_USER) {
			this.formats.splice(-1, 0, { value: 'freeset', display: 'Free Set' });
		}

		this.disableChannel.postMessage(false);
		this.targetFC.disable();
	}

	getMapsetInfo() {
		this.refsetService.getMapsetByCode(this.mapsetCode).subscribe((results) => {
			this.mapsetInfo = results;

			const stepperClass = 'details-page-stepper-started-step';
			this.stepperInfo = CodeUtility.clone(this.stepperStartInfo);
			switch (this.mapsetInfo.workflowStatus) {
				case 'READY_FOR_EDIT':
					this.stepperInfo['READY_FOR_EDIT_COLOR'] = stepperClass;
					this.stepperInfo['READY_FOR_EDIT_STARTED'] = true;
					break;
				case 'IN_EDIT':
					this.stepperInfo['IN_EDIT_COLOR'] = stepperClass;
					this.stepperInfo['IN_EDIT_STARTED'] = true;
					break;
				case 'IN_UPGRADE':
					this.stepperInfo['IN_UPGRADE_COLOR'] = stepperClass;
					this.stepperInfo['IN_UPGRADE_STARTED'] = true;
					break;
				case 'READY_FOR_REVIEW':
					this.stepperInfo['READY_FOR_EDIT_COLOR'] = stepperClass;
					this.stepperInfo['READY_FOR_EDIT_STARTED'] = true;
					this.stepperInfo['READY_FOR_REVIEW_COLOR'] = stepperClass;
					this.stepperInfo['READY_FOR_REVIEW_STARTED'] = true;
					break;
				case 'IN_REVIEW':
					this.stepperInfo['IN_REVIEW_COLOR'] = stepperClass;
					this.stepperInfo['IN_REVIEW_STARTED'] = true;
					break;
				case 'REVIEW_COMPLETED':
					this.stepperInfo['READY_FOR_EDIT_COLOR'] = stepperClass;
					this.stepperInfo['READY_FOR_EDIT_STARTED'] = true;
					this.stepperInfo['READY_FOR_REVIEW_COLOR'] = stepperClass;
					this.stepperInfo['READY_FOR_REVIEW_STARTED'] = true;
					this.stepperInfo['REVIEW_COMPLETED_COLOR'] = stepperClass;
					this.stepperInfo['REVIEW_COMPLETED_STARTED'] = true;
					break;
				case 'READY_FOR_PUBLICATION':
					this.stepperInfo['READY_FOR_EDIT_COLOR'] = stepperClass;
					this.stepperInfo['READY_FOR_EDIT_STARTED'] = true;
					this.stepperInfo['READY_FOR_REVIEW_COLOR'] = stepperClass;
					this.stepperInfo['READY_FOR_REVIEW_STARTED'] = true;
					this.stepperInfo['REVIEW_COMPLETED_COLOR'] = stepperClass;
					this.stepperInfo['REVIEW_COMPLETED_STARTED'] = true;
					this.stepperInfo['READY_FOR_PUBLICATION_COLOR'] = stepperClass;
					this.stepperInfo['READY_FOR_PUBLICATION_STARTED'] = true;
					break;
				case 'IN_PUBLICATION':
					this.stepperInfo['IN_PUBLICATION_COLOR'] = stepperClass;
					this.stepperInfo['IN_PUBLICATION_STARTED'] = true;
					break;
				case 'PUBLISHED':
					this.stepperInfo['READY_FOR_EDIT_COLOR'] = stepperClass;
					this.stepperInfo['READY_FOR_EDIT_STARTED'] = true;
					this.stepperInfo['READY_FOR_REVIEW_COLOR'] = stepperClass;
					this.stepperInfo['READY_FOR_REVIEW_STARTED'] = true;
					this.stepperInfo['REVIEW_COMPLETED_COLOR'] = stepperClass;
					this.stepperInfo['REVIEW_COMPLETED_STARTED'] = true;
					this.stepperInfo['READY_FOR_PUBLICATION_COLOR'] = stepperClass;
					this.stepperInfo['READY_FOR_PUBLICATION_STARTED'] = true;
					this.stepperInfo['PUBLISHED_COLOR'] = stepperClass;
					this.stepperInfo['PUBLISHED_STARTED'] = true;
					break;
				default: //null
					this.stepperInfo['READY_FOR_EDIT_COLOR'] = stepperClass;
					this.stepperInfo['READY_FOR_EDIT_STARTED'] = true;
					break;
			}
		});
		this.refsetService.getMapsets().subscribe({
			next: (results) => {
				const thisResult = results.filter((res) => {
					return res.refSetCode === this.mapsetCode;
				});
				this.mapsetName = thisResult[0]?.refSetName;
				this.selectedMapset = thisResult[0];
			},
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

	getMapProject() {
		const params: any = {
			includeMembers: false,
		};
		const projectId = environment.defaultProjectId; //TEST ONLY
		this.refsetService.getMapProjectById(projectId, params).subscribe({
			next: (results) => {
				this.targetTerminology = results.destinationTerminology;
				this.targetTerminologyVersion = results.destinationTerminologyVersion;
				this.ruleBased = results.ruleBased;
				this.projectRelations = results.mapRelations || [];
				const that = this;
				if (this.projectRelations.length > 0) {
					this.targetRelations = this.projectRelations
						.filter(function (res) {
							return res.allowableForNullTarget === false;
						})
						.map(function (res) {
							return that.titleCaseWord(res.name);
						});

					this.noTargetRelations = this.projectRelations
						.filter(function (res) {
							return res.allowableForNullTarget === true;
						})
						.map(function (res) {
							return that.titleCaseWord(res.name);
						});

					this.mapRelations = this.projectRelations.map((res) => {
						return this.titleCaseWord(res.name);
					});
				}
				this.mapAdvices = results.mapAdvices || [];
				if (this.mapAdvices.length > 0) {
					this.mapAdvices = this.mapAdvices.map((res) => {
						return res.name;
					});
				}
			},
			error: (err: any) => {
				this.loadError = true;
				console.log(' project loading error', err);
			},
		});
	}

	titleCaseWord(word: string) {
		if (!word) return word;
		return word[0].toUpperCase() + word.substr(1).toLowerCase();
	}

	getModuleLanguageIcon(moduleId: string) {
		let flag = '';
		this.moduleMetadata.module.forEach((data) => {
			if (data.id === moduleId) {
				flag = data.countryCode;
			}
		});
		return flag;
	}

	getModuleLanguageName(moduleId: string) {
		let lang = '';
		this.moduleMetadata.module.forEach((data) => {
			if (data.id === moduleId) {
				lang = data.name;
			}
		});
		return lang;
	}

	clearTargetInput() {
		this.foundConceptCode = false;
		this.targetCodeInput = '';
		this.targetFC.reset();
		this.targetFC.setValue(this.targetCodeInput);
		this.targetNameInput = '';
		this.targetInput.nativeElement.focus();
	}

	@Debounce()
	onInputTargetChange() {
		this.targetCodeInput = this.targetFC.value;
		this.targetCodeInput = this.targetCodeInput.trim();
		if (this.targetCodeInput.length > 2) {
			this.targetNameInput = 'Searching...';
			this.getConceptByCode();
		}
	}

	sortEntries() {
		this.mapsetData[0].mapEntries.sort((a, b) => {
			if (a.group !== b.group) {
				return a.group - b.group;
			} else {
				return a.priority - b.priority;
			}
		});
	}

	drop(event: CdkDragDrop<string[]>) {
		this.userChanged = true;
		for (let p = 0; p < this.mapsetData[0].mapEntries.length; p++) {
			if (this.mapsetData[0].mapEntries[p].group - 1 === event.previousIndex) {
				this.mapsetData[0].mapEntries[p].group = 'next';
			}
			if (this.mapsetData[0].mapEntries[p].group - 1 === event.currentIndex) {
				this.mapsetData[0].mapEntries[p].group = 'prev';
			}
		}
		for (let p = 0; p < this.mapsetData[0].mapEntries.length; p++) {
			if (this.mapsetData[0].mapEntries[p].group === 'next') {
				this.mapsetData[0].mapEntries[p].group = event.currentIndex + 1;
			}
			if (this.mapsetData[0].mapEntries[p].group === 'prev') {
				this.mapsetData[0].mapEntries[p].group = event.previousIndex + 1;
			}
		}
		this.sortEntries();
	}

	dropT(event: CdkDragDrop<string[]>) {
		this.userChanged = true;
		const newGroup = [];
		for (let p = 0; p < this.mapsetData[0].mapEntries.length; p++) {
			if (this.mapsetData[0].mapEntries[p].group === event.item.data.group) {
				newGroup.push(this.mapsetData[0].mapEntries[p]);
			}
		}
		newGroup[event.previousIndex].priority = newGroup[event.currentIndex].priority;
		const temp = newGroup.splice(event.previousIndex, 1);
		newGroup.splice(event.currentIndex, 0, temp);
		for (let n = 0; n < newGroup.length; n++) {
			newGroup[n].priority = n + 1;
		}

		for (let p = 0; p < this.mapsetData[0].mapEntries.length; p++) {
			for (let i = 0; i < newGroup.length; i++) {
				if (this.mapsetData[0].mapEntries[p].uuid === newGroup[i].uuid) {
					this.mapsetData[0].mapEntries[p] = newGroup[i];
				}
			}
		}

		this.sortEntries();
	}

	reloadMapping() {
		this.loaded = false;
		this.userChanged = false;
		this.targetFC.disable();
		this.selectedTarget.id = '';
		this.clearTargetInput();
		this.getMapsetInfo();
		this.getMapsetData();
		const refreshInterval = setInterval(() => {
			this.notificationService.show('The changes have been removed.', null, 'success', { timeOut: 4500, extendedTimeOut: 0 });
			clearInterval(refreshInterval);
		}, 250);
	}

	searchAutoComplete: OperatorFunction<string, readonly { name; code }[]> = (text$: Observable<string>) =>
		text$.pipe(
			debounceTime(600),
			distinctUntilChanged(),
			switchMap((term) => this.fetchData(term)),
		);
	fetchData(term: string): Observable<any> {
		if (term.length >= 2 && !this.searchByKeyboard) {
			return this.refsetService
				.searchConceptByQuery(this.targetTerminology, this.targetTerminologyVersion, term, '10')
				.pipe(map((data) => data.items));
		} else {
			return of([]); // return an empty array if the term length is less than 3
		}
	}

	//for selecting item from suggestions
	selectItemFromMenu(menu: any) {
		this.searchByTypeahead = true;
		this.targetCodeInput = menu.item.code;
		this.targetNameInput = menu.item.name;
		this.foundConceptCode = true;
	}

	//form submmision without selecting from dropdown
	onKeyPress(e) {
		this.searchByKeyboard = true;
		this.targetNameInput = '';
		this.targetCodeInput = this.targetFC.value;
		this.getConceptByCode();
		this.handleCloseDropDown();
	}

	handleCloseDropDown() {
		//Quick search
		setTimeout(() => {
			const typeaheadElement = this.elementRef.nativeElement.querySelector('#ngb-typeahead-0');
			if (typeaheadElement) {
				this.renderer.removeClass(typeaheadElement, 'show');
			}
		}, 1400);
	}

	getConceptByCode() {
		this.refsetService.getConceptByCode(this.targetTerminology, this.targetTerminologyVersion, this.targetCodeInput).subscribe({
			next: (results) => {
				this.searchByKeyboard = false;
				this.foundConceptCode = false;
				if (results === null) {
					this.targetNameInput = 'CONCEPT NOT FOUND';
				} else {
					if (results.name.indexOf('CONCEPT NOT FOUND') === -1) {
						this.foundConceptCode = true;
					}
					this.targetNameInput = results.name;
				}
			},
			error: (error) => {
				//
			},
		});
	}

	getMapsetData() {
		this.refsetService.getMappingByMapsetConceptList(this.mapsetCode, this.conceptCode).subscribe({
			next: (response) => {
				this.loaded = true;
				const data = [];
				let count = 0;
				const results = response.items[0];
				results.mapEntries.sort((a, b) => {
					if (a.group !== b.group) {
						return a.group - b.group;
					} else {
						return a.priority - b.priority;
					}
				});

				for (let b = 0; b < results.mapEntries.length; b++) {
					let spanned = false;
					results.mapEntries[b].uuid = results.code + results.mapEntries[b].modified + b;
					results.mapEntries[b].advices_open = false;
					if (results.mapEntries.length > 1) {
						if (b >= 1) {
							spanned = true;
						}
					}
					if (this.numOfGroups < results.mapEntries[b].group) {
						this.numOfGroups = results.mapEntries[b].group;
					}

					//remove advice ""
					results.mapEntries[b].advices = results.mapEntries[b].advices.filter(function (res) {
						return res !== '';
					});
					let adviceAlways = [];
					adviceAlways = results.mapEntries[b].advices.filter(function (res) {
						return res.indexOf('ALWAYS') > -1;
					});
					let mapAdvices = [];
					mapAdvices = results.mapEntries[b].advices.filter(function (res) {
						return res.indexOf('ALWAYS') === -1;
					});
					results.mapEntries[b].mapAdvices = mapAdvices;
					results.mapEntries[b].adviceAlways = adviceAlways;
					results.mapEntries[b].modFlag = this.getModuleLanguageIcon(results.mapEntries[b].moduleId);
					results.mapEntries[b].modLang = this.getModuleLanguageName(results.mapEntries[b].moduleId);
					if (!spanned) {
						data.push({
							index: results.code + count,
							active: results.active,
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
							relation: results.mapEntries[b].relation.length > 0 ? results.mapEntries[b].relation.toUpperCase() : '---',
							modified: results.mapEntries[b].modified,
							advices: results.mapEntries[b].advices,
							group: results.mapEntries[b].group,
							groupTotal: results.mapEntries[b].group,
							priority: results.mapEntries[b].priority,
							moduleId: results.mapEntries[b].moduleId,
							modFlag: this.getModuleLanguageIcon(results.mapEntries[b].moduleId),
							modLang: this.getModuleLanguageName(results.mapEntries[b].moduleId),
						});
						count++;
					}
				}
				this.groupList = [];
				for (let i = 0; i < this.numOfGroups; i++) {
					this.groupList.push('group' + i);
				}

				this.mapsetData = data;
				this.breadcrumbService.setBreadcrumbs([
					{ path: '/library', label: 'Library' },
					{ path: '/mapset/' + this.mapsetCode + '/mappings', label: this.mapsetName },
					{ label: 'Edit ' + (this.mapsetData.length > 0 ? this.mapsetData[0]?.name : 'Map') },
				]);
			},
			error: (error) => {
				//
			},
		});
	}

	addMapGroup() {
		this.numOfGroups++;
		this.groupList.push('group' + this.numOfGroups);
	}

	getGroupTotal(group) {
		let total = 0;

		for (let u = 0; u < this.mapsetData[0].mapEntries.length; u++) {
			if (this.mapsetData[0].mapEntries[u].group === group) {
				total++;
			}
		}

		return total;
	}

	getGroupEntriesById(group) {
		//order by group then priority list then drag and drop will work...
		const groupEntries = [];
		for (let u = 0; u < this.mapsetData[0].mapEntries.length; u++) {
			if (this.mapsetData[0].mapEntries[u].group === group) {
				groupEntries.push(this.mapsetData[0].mapEntries[u]);
			}
		}
		return groupEntries;
	}

	removeMapGroup() {
		const groupNum: number = this.removeId;
		for (let d = this.mapsetData[0].mapEntries.length - 1; d > 0; d--) {
			if (this.mapsetData[0].mapEntries[d].group === groupNum) {
				this.mapsetData[0].mapEntries.splice(d, 1);
			}
		}
		this.numOfGroups--;
		this.groupList.pop();
		this.userChanged = true;
	}

	searchBrowser() {
		if (!this.showBrowserSection) {
			this.toggleSectionView('showBrowserSection');
			this.secondWindow.nativeElement.scrollIntoView({ behavior: 'smooth', block: 'start' });
		}
		if (this.selectedTarget.id !== '') {
			const openInterval = setInterval(() => {
				this.searchBrowserInput = this.targetFC.value['code'];
				this.onBrowserSearchChange();
				clearInterval(openInterval);
			}, 100);
		}
	}

	setEmptyTarget() {
		this.clearTargetInput();
		this.userChanged = true;
		let defaultRule = '';
		if (!this.ruleBased) {
			defaultRule = 'TRUE';
		}
		let defaultRelationship = '';
		for (let r = 0; r < this.projectRelations.length; r++) {
			if (this.projectRelations[r].allowableForNullTarget === true) {
				defaultRelationship = this.titleCaseWord(this.projectRelations[r].name);
				break;
			}
		}
		this.mapsetData[0].mapEntries.forEach((data) => {
			if (data.uuid === this.selectedTarget.id) {
				data.toCode = '';
				data.toName = '[NO TARGET]';
				data.relation = defaultRelationship;
				data.moduleId = this.tempModuleIdChangeBeforeRelease;
				data.modFlag = '';
				data.modLang = '';
				data.rule = defaultRule;
				data.additionalMapEntryInfos = [];
				data.mapAdvices = [];
				data.adviceAlways = [];
				data.advices = [];
				data.descriptions = [];
			}
		});
	}

	addEmptyTargetToGroup(groupNum: number) {
		let nextPriorityNum = 1;
		for (let p = 0; p < this.mapsetData[0].mapEntries.length; p++) {
			if (this.mapsetData[0].mapEntries[p].group === groupNum) {
				if (this.mapsetData[0].mapEntries[p].priority >= nextPriorityNum) {
					nextPriorityNum++;
				}
			}
		}
		let defaultRule = '';
		if (!this.ruleBased) {
			defaultRule = 'TRUE';
		}
		let defaultRelationship = '';
		if (this.projectRelations.length > 0) {
			for (let r = 0; r < this.projectRelations.length; r++) {
				if (this.projectRelations[r].allowableForNullTarget === true) {
					defaultRelationship = this.titleCaseWord(this.projectRelations[r].name);
					break;
				}
			}
		}
		const newMapEntry = {
			active: true,
			additionalMapEntryInfos: [],
			mapAdvices: [],
			adviceAlways: [],
			advices: [],
			descriptions: [],
			block: 0,
			created: null,
			group: groupNum,
			id: null,
			modified: null,
			modifiedBy: null,
			moduleId: this.tempModuleIdChangeBeforeRelease,
			modFlag: '',
			modLang: '',
			priority: nextPriorityNum,
			relation: defaultRelationship,
			rule: defaultRule,
			toCode: '',
			toName: '[NO TARGET]',
			uuid: String(groupNum + nextPriorityNum + Date.now()),
		};

		this.targetCodeInput = '';
		this.targetNameInput = '';
		this.mapsetData[0].mapEntries.push(newMapEntry);
		this.setSelectedTarget(newMapEntry.uuid, newMapEntry.toCode, newMapEntry.toName, newMapEntry.group, newMapEntry.priority);
		this.userChanged = true;
	}

	removeTarget() {
		const uuid: string = this.removeId;
		let changedPriority = 0;
		let groupNum = 0;
		for (let p = 0; p < this.mapsetData[0].mapEntries.length; p++) {
			if (this.mapsetData[0].mapEntries[p].uuid === uuid) {
				groupNum = this.mapsetData[0].mapEntries[p].group;
				changedPriority = this.mapsetData[0].mapEntries[p].priority;
				this.mapsetData[0].mapEntries.splice(p, 1);
			}
		}
		for (let c = 0; c < this.mapsetData[0].mapEntries.length; c++) {
			if (this.mapsetData[0].mapEntries[c].group === groupNum) {
				if (this.mapsetData[0].mapEntries[c].priority > changedPriority) {
					this.mapsetData[0].mapEntries[c].priority--;
				}
			}
		}
		this.userChanged = true;
	}

	setSelectedTarget(uuid: string, code: string, name: string, group: number, priority: number) {
		if (this.mapsetInfo.workflowStatus === 'IN_EDIT') {
			this.targetFC.enable();
			this.selectedTarget.id = uuid;
			this.selectedTarget.group = group;
			this.selectedTarget.priority = priority;
			this.targetCodeInput = code;
			this.targetNameInput = name === '[NO TARGET]' ? '' : name;
			this.targetFC.reset();
			this.targetFC.setValue(this.targetCodeInput);
			this.query = { code: this.targetCodeInput };
			this.targetInput.nativeElement.focus();
		}
	}

	setTargetCode() {
		let defaultRule = '';
		if (!this.ruleBased) {
			defaultRule = 'TRUE';
		}
		let defaultRelationship = '';
		for (let r = 0; r < this.projectRelations.length; r++) {
			if (this.projectRelations[r].allowableForNullTarget === false) {
				defaultRelationship = this.titleCaseWord(this.projectRelations[r].name);
				break;
			}
		}
		if (this.selectedTarget.id === '') {
			let nextPriorityNum = 1;
			for (let p = 0; p < this.mapsetData[0].mapEntries.length; p++) {
				if (this.mapsetData[0].mapEntries[p].group === this.numOfGroups) {
					if (this.mapsetData[0].mapEntries[p].priority >= nextPriorityNum) {
						nextPriorityNum++;
					}
				}
			}

			const newMapEntry = {
				active: true,
				additionalMapEntryInfos: [],
				mapAdvices: [],
				adviceAlways: [],
				advices: [],
				descriptions: [],
				block: 0,
				created: null,
				group: this.numOfGroups,
				id: null,
				modified: null,
				modifiedBy: null,
				moduleId: this.tempModuleIdChangeBeforeRelease,
				modFlag: '',
				modLang: '',
				priority: nextPriorityNum,
				relation: defaultRelationship,
				rule: defaultRule,
				toCode: this.targetCodeInput,
				toName: this.targetNameInput,
				uuid: this.numOfGroups + nextPriorityNum + Date.now(),
			};
			this.mapsetData[0].mapEntries.push(newMapEntry);
		} else {
			for (let p = 0; p < this.mapsetData[0].mapEntries.length; p++) {
				if (this.mapsetData[0].mapEntries[p].uuid === this.selectedTarget.id) {
					this.mapsetData[0].mapEntries[p].toCode = this.targetCodeInput;
					this.mapsetData[0].mapEntries[p].toName = this.targetNameInput;
					this.mapsetData[0].mapEntries[p].moduleId = this.tempModuleIdChangeBeforeRelease;
					this.mapsetData[0].mapEntries[p].modFlag = '';
					this.mapsetData[0].mapEntries[p].modLang = '';
					this.mapsetData[0].mapEntries[p].relation = defaultRelationship;
					this.mapsetData[0].mapEntries[p].rule = defaultRule;
					this.mapsetData[0].mapEntries[p].additionalMapEntryInfos = [];
					this.mapsetData[0].mapEntries[p].mapAdvices = [];
					this.mapsetData[0].mapEntries[p].adviceAlways = [];
					this.mapsetData[0].mapEntries[p].advices = [];
					this.mapsetData[0].mapEntries[p].descriptions = [];
				}
			}
		}
		this.selectedTarget.id = '';
		this.targetFC.disable();
		this.foundConceptCode = false;
		this.clearTargetInput();
		this.userChanged = true;
	}

	setTarget(currentConcept: any) {
		this.targetCodeInput = currentConcept.code;
		this.targetNameInput = currentConcept.name;
		this.setTargetCode();
	}

	userChangeSelection(selectBox) {
		switch (selectBox) {
			case 'norelation':
				this.selectRelationship.value = '';
				break;
			case 'relation':
				this.selectRelationship.value = '';
				break;
			case 'rule':
				this.selectRule.value = '';
				break;
		}
		this.userChanged = true;
	}

	saveMapping() {
		const saveMapset = {
			code: this.mapsetData[0].code,
			name: this.mapsetData[0].name,
			active: this.mapsetData[0].active,
			mapEntries: [],
		};

		for (let m = 0; m < this.mapsetData[0].mapEntries.length; m++) {
			const uiEntry = this.mapsetData[0].mapEntries[m];

			const mapEntry = {
				advices: uiEntry.advices,
				toCode: uiEntry.toCode,
				toName: uiEntry.toName,
				rule: uiEntry.rule,
				priority: uiEntry.priority,
				relation: uiEntry.relation.toUpperCase(),
				group: uiEntry.group,
				block: uiEntry.block,
				moduleId: uiEntry.moduleId,
				active: uiEntry.active,
				additionalMapEntryInfos: uiEntry.additionalMapEntryInfos,
				descriptions: uiEntry.descriptions,
				id: uiEntry.id,
				modified: uiEntry.modified,
				created: uiEntry.created,
				modifiedBy: uiEntry.modifiedBy,
			};
			saveMapset.mapEntries.push(mapEntry);
		}

		const params: any = {
			mapping: saveMapset,
			conceptCode: this.conceptCode,
		};

		this.userChanged = false;
		this.refsetService.getMapsetWorkflowStatus(this.mapsetCode).subscribe((status) => {
			if (status.workflowStatus === 'IN_EDIT') {
				this.refsetService.updateMapsetMapping(this.mapsetCode, saveMapset).subscribe(
					(status) => {
						this.notificationService.show('The mapping has been saved.', null, 'success', { timeOut: 0, extendedTimeOut: 0 });
					},
					(error) => {
						//
					},
				);
			} else {
				this.notificationService.show('Mapset workflow status is not in Edit mode.');
			}
		});
	}

	showDropdown(): void {
		this.toggleDropdown = !this.toggleDropdown;
	}

	openGroupPopover(event: any, uuid: string) {
		if (this.mapsetInfo.workflowStatus === 'IN_EDIT') {
			this.closePopover();
			this.groupFC.reset();
			this.mapsetData.forEach((data) => {
				data.mapEntries.forEach((entry) => {
					if (entry.group_open) {
						entry.group_open = false;
					}
					if (entry.uuid === uuid) {
						entry.group_open = true;
						entry.adviceToAdd = '';
					}
				});
			});
			const popHeight = 0;

			const showInterval = setInterval(() => {
				this.advicePopoverLocation = event.layerY + event.offsetY + 5;
				this.groupInput.nativeElement.focus();
				clearInterval(showInterval);
			}, 5);
		}
	}

	menuBrowserOpened() {
		this.browserSearchInput.nativeElement.focus();
	}

	clearGroupInput() {
		this.groupFC.reset();
	}

	numberOnly(event): boolean {
		const charCode = event.which ? event.which : event.keyCode;
		if (charCode > 31 && (charCode < 48 || charCode > 57)) {
			event.preventDefault();
			return false;
		}
		if (event.key === '-') {
			event.preventDefault();
			return false;
		}
		return true;
	}

	setGroup(uuid: string) {
		const addSetGroup = setInterval(() => {
			if (Number(this.groupFC.value) > this.numOfGroups) {
				this.addMapGroup();
			} else {
				this.userChanged = true;
				this.mapsetData.forEach((data) => {
					data.mapEntries.forEach((entry) => {
						if (entry.uuid === uuid) {
							entry.group = this.groupFC.value;
							this.groupFC.reset();
							entry.group_open = false;
						}
					});
				});
				this.sortEntries();
				clearInterval(addSetGroup);
			}
		}, 5);
	}

	closeGroup() {
		this.groupFC.reset();
		this.mapsetData.forEach((data) => {
			data.mapEntries.forEach((entry) => {
				if (entry.group_open) {
					entry.group_open = false;
				}
			});
		});
	}

	openPopover(event: any, uuid: string) {
		this.closeGroup();
		this.mapsetData.forEach((data) => {
			data.mapEntries.forEach((entry) => {
				if (entry.advices_open) {
					entry.advices_open = false;
				}
				if (entry.uuid === uuid) {
					entry.addAdviceList = [];
					if (this.mapAdvices.length > 0) {
						entry.updateAdviceList = JSON.parse(JSON.stringify(entry.mapAdvices));
						this.mapAdvices.forEach((map) => {
							let found = false;
							entry.updateAdviceList.forEach((advice) => {
								if (map === advice) {
									found = true;
								}
							});
							if (!found) {
								entry.addAdviceList.push(map);
							}
						});

						entry.addAdviceList.sort((a, b) => (a > b ? 1 : -1));
						entry.updateAdviceList.sort((a, b) => (a > b ? 1 : -1));
						entry.advices_open = true;
					}
					entry.adviceToAdd = '';
				}
			});
		});
		this.updateAdviceList.sort((a, b) => (a > b ? 1 : -1));
		const popHeight = 0;

		const showInterval = setInterval(() => {
			this.advicePopoverLocation = event.layerY + event.offsetY + 5;
			clearInterval(showInterval);
		}, 5);
	}

	addAdviceToList(uuid: string) {
		this.userChanged = true;
		this.mapsetData.forEach((data) => {
			data.mapEntries.forEach((entry) => {
				if (entry.uuid === uuid) {
					if (entry.adviceToAdd !== '') {
						entry.updateAdviceList.push(entry.adviceToAdd);
						entry.updateAdviceList.sort((a, b) => (a > b ? 1 : -1));
						entry.addAdviceList.splice(entry.addAdviceList.indexOf(entry.adviceToAdd), 1);
						entry.addAdviceList.sort((a, b) => (a > b ? 1 : -1));
						entry.adviceToAdd = null;
						entry.adviceToAdd = '';
					}
				}
			});
		});
		this.selectAdvice.value = '';
	}

	removeAdviceFromList(uuid: string, advice: string) {
		this.userChanged = true;
		this.mapsetData.forEach((data) => {
			data.mapEntries.forEach((entry) => {
				if (entry.uuid === uuid) {
					entry.adviceToAdd = null;
					entry.adviceToAdd = '';
					entry.addAdviceList.push(advice);
					entry.addAdviceList.sort((a, b) => (a > b ? 1 : -1));
					entry.updateAdviceList.splice(entry.updateAdviceList.indexOf(advice), 1);
					entry.updateAdviceList.sort((a, b) => (a > b ? 1 : -1));
				}
			});
		});
	}

	setAdvice(uuid: string) {
		this.userChanged = true;
		this.mapsetData.forEach((data) => {
			data.mapEntries.forEach((entry) => {
				if (entry.uuid === uuid) {
					entry.mapAdvices = JSON.parse(JSON.stringify(entry.updateAdviceList));
					entry.advices = JSON.parse(JSON.stringify(entry.mapAdvices));
					if (entry.adviceAlways.length > 0) {
						entry.advices.unshift(entry.adviceAlways[0]);
					}
					entry.advices_open = false;
				}
			});
		});
	}

	closePopover() {
		this.mapsetData.forEach((data) => {
			data.mapEntries.forEach((entry) => {
				if (entry.advices_open) {
					entry.adviceToAdd = null;
					entry.adviceToAdd = '';
					entry.advices_open = false;
				}
			});
		});
	}

	openConfirmationModal(removeId, removeType) {
		this.removeId = removeId;
		this.removeType = removeType;
		this.confirmModalRef = this.modalService.open(this.confirmationModal, { centered: true });
		this.isModalOpen = true;
	}

	closeConfirmDialog() {
		this.confirmModalRef.close();
		this.isModalOpen = false;
	}

	confirmRemoveItem() {
		switch (this.removeType) {
			case 'group':
				this.removeMapGroup();
				break;
			case 'target':
				this.removeTarget();
				break;
		}
		this.closeConfirmDialog();
	}

	createDataSource() {
		return {
			rowCount: null,
			getRows: (rowParams) => {
				const startRow = rowParams.startRow;
				const endRow = rowParams.endRow;
				const sortModel = rowParams.sortModel;
				this.browserApi.showLoadingOverlay();

				let query = this.searchBrowserInput;
				if (this.searchBrowserInput === '') {
					query = '';
				}

				if (this.isNewPageSize) {
					rowParams.failCallback();
				} else {
					this.browserLoaded = false;
					let limit = endRow - startRow;

					if (this.numOfMembers > 0) {
						if (startRow + limit > this.numOfMembers) {
							limit = this.numOfMembers - startRow;
						}
					}

					const restParams: any = {
						offset: startRow,
						limit: this.browserPaging.pageSize,
					};

					if (CodeUtility.hasValue(query)) {
						query = query.replace(/\//g, '%2F').replace(/%/g, '%25');
						restParams.filter = query;
					} else {
						restParams.filter = '';
					}

					this.browserSubscription = this.refsetService
						.searchBrowserByQuery(this.targetTerminology, this.targetTerminologyVersion, query, restParams.offset, restParams.limit)
						.subscribe({
							next: (response) => {
								this.numOfMembers = response.total;
								this.browserData = response.items;
								this.browserLoaded = true;
								this.changeDetectorRef.detectChanges();

								const lastIndex = document.getElementsByClassName('ag-header').length - 1;
								const child = document.getElementsByClassName('ag-header')[lastIndex];
								document.getElementById('browserHeader').appendChild(child);
								const lastIndexP = document.getElementsByClassName('ag-paging-panel').length - 1;
								const childP = document.getElementsByClassName('ag-paging-panel')[lastIndexP];
								document.getElementById('directoryPaging').appendChild(childP);

								this.showPaging = true;

								if (this.browserData?.length > 0) {
									this.showPaging = true;
									this.browserApi.hideOverlay();
									this.paginationPages = Math.ceil(this.numOfMembers / this.browserPaging.pageSize)
										? this.pagerService.getPager(
												Math.ceil(this.numOfMembers / this.browserPaging.pageSize),
												this.browserApi.paginationGetCurrentPage(),
												true,
											)
										: {};

									this.paginationPages.currentPage = this.getCurrentPage();

									const lastRow = this.numOfMembers;
									rowParams.successCallback(this.browserData, lastRow);
								}
								if (this.numOfMembers === 0) {
									this.showPaging = false;
									this.browserApi.showNoRowsOverlay();
									rowParams.successCallback([], 0);
								}

								this.browserPaging.manualStateRefresh = Boolean(true);
								// set placeholders on the grid floating filter fields
								Array.from(document.querySelectorAll('.ag-floating-filter-body .ag-input-field-input')).forEach((obj: any) => {
									if (obj.attributes['disabled']) {
										// skip columns with disabled filter
										return;
									}

									const label = obj.getAttribute('aria-label');
									const value = label.substring(0, label.indexOf('Filter Input')) + '...';
									obj.setAttribute('placeholder', value);
								});
								this.browserSubscription.unsubscribe();
							},
							error: (error) => {
								this.showPaging = false;
								this.browserApi.showNoRowsOverlay();
								rowParams.successCallback([], 0);
							},
						});
				}
			},
		};
	}

	firstLoadBrowser() {
		this.browserColumnDefs = [
			{
				field: 'code',
				tooltipField: 'code',
				headerName: 'Code',
				headerTooltip: 'Code',
				flex: 1,
				width: 125,
				cellClass: 'blue-link',
				resizable: false,
				sortable: false,
				suppressSorting: true,
			},
			{
				field: 'name',
				tooltipField: 'name',
				headerName: 'Name',
				headerTooltip: 'Name',
				flex: 2,
				minWidth: 165,
				resizable: false,
				sortable: false,
				suppressSorting: true,
			},
		];
		this.browserOptions = {
			context: { componentParent: this },
			pagination: true,
			angularCompileHeaders: true,
			suppressColumnVirtualisation: true,
			suppressPaginationPanel: true,
			rowModelType: 'infinite',
			suppressScrollOnNewData: true,
			suppressColumnMoveAnimation: true,
			suppressDragLeaveHidesColumns: true,
			debounceVerticalScrollbar: true,
			animateRows: false,
			debug: false,
			cacheOverflowSize: 2,
			maxBlocksInCache: 2,
			maxConcurrentDatasourceRequests: 2,
			serverSideEnableClientSideSort: true,
			cacheBlockSize: this.browserPaging.pageSize,
			paginationPageSize: this.browserPaging.pageSize,
			paginationPageSizeSelector: this.browserPaging.pageSizeOptions,
			rowSelection: 'single',
			datasource: this.createDataSource(),
			enableCellTextSelection: true,
			onGridReady: this.onBrowserReady,
			onCellClicked: this.onBrowserCellClick,
			onPaginationChanged: (event: any) => this.onPaginationChanged(event),
			domLayout: 'autoHeight',
			frameworkComponents: {
				templateRenderer: TemplateRendererComponent,
			},
			defaultColDef: {
				sortable: false,
				filter: false,
				sortingOrder: ['asc', 'desc'],
				floatingFilter: false,
				suppressMenu: true,
				resizable: true,
				suppressSorting: true,
				suppressMovable: true,
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
		this.showTable = true;
	}

	clearBrowserSearch() {
		this.showLoadingSearch = false;
		if (this.searchBrowserInput) {
			this.searchBrowserInput = '';
			this.onBrowserSearchChange();
		}
	}

	@Debounce()
	onBrowserSearchChange() {
		this.searchBrowserInput = this.searchBrowserInput.trim();

		if (!CodeUtility.hasValue(this.searchBrowserInput) || (CodeUtility.hasValue(this.searchBrowserInput) && this.searchBrowserInput.length > 2)) {
			this.setPageSize(10);
			this.goToPage(0);
			this.browserLoaded = false;
			this.browserApi.purgeInfiniteCache();
		}
	}

	/*Pagination functions */
	onPaginationChanged(event: PaginationChangedEvent) {
		if (this.browserApi) {
			this.isNewPageSize = event.newPageSize ?? false;
			this.browserPaging.pageSize = this.browserApi.paginationGetPageSize();
			this.browserApi.updateGridOptions({
				paginationPageSize: this.browserPaging.pageSize,
				cacheBlockSize: this.browserPaging.pageSize,
			});
			// this.getBrowserData();
		}
	}

	setPageSize(size: number) {
		// this.browserApi.paginationGoToFirstPage();
		this.goToPage(0);
		this.browserApi.setGridOption('paginationPageSize', size);
	}

	goToPage(number: number) {
		this.browserApi.paginationGoToPage(number);
		//this.getBrowserData();
	}

	getCurrentPage() {
		let current = 1;
		if (this.browserApi) {
			current = this.browserApi.paginationGetCurrentPage();
		}
		return current;
	}

	onBrowserReady = (params) => {
		this.browserParams = params;
		this.browserApi = params.api;
	};

	onBrowserCellClick = (event) => {
		if (
			event.column.colId !== 'checkbox' &&
			event.column.colId !== 'action-btns' &&
			event.column.colId !== 'relation-select' &&
			event.column.colId !== 'rule-select'
		) {
			this.loadConceptDetail(event.data.code);
		}
	};

	loadConceptDetail(code: string) {
		this.refsetService.getConceptByCode(this.targetTerminology, this.targetTerminologyVersion, code).subscribe({
			next: (results) => {
				this.currentConcept = results;
				this.conceptDetail = true;
			},
			error: (error) => {
				//
			},
		});
	}

	closeConceptDetails() {
		this.conceptDetail = false;
	}

	openToBeDevelopedModal(content) {
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

	dateFormatter(val): any {
		return UiUtility.dateFormatter(val);
	}

	selectActionMenu(action: string) {
		switch (action) {
			case 'view':
				this.goToMappingPage('_self');
				break;
			default:
				this.openToBeDevelopedModal(this.tbdModal);
		}
	}

	goToMappingPage(target: string) {
		switch (target) {
			case '_blank':
				this.router.navigate([]).then((result) => {
					window.open('/mapset/' + this.mapsetCode + '/mapping/' + this.conceptCode, target);
				});
				break;
			default:
				this.router.navigate(['/mapset/' + this.mapsetCode + '/mapping/' + this.conceptCode], {
					replaceUrl: false,
					skipLocationChange: false,
				});
		}
	}

	toggleSectionView(section: string) {
		if (section === 'showBrowserSection' && !this.loadedBrowser) {
			this.loadedBrowser = true;
		}
		if (this[section]) {
			this[section] = false;
		} else {
			this[section] = true;
			this.onResize(undefined);
		}
	}

	onResize(event) {
		//this.closePopover();
	}

	@HostListener('window:scroll', ['$event'])
	onScroll(event) {
		//this.closePopover();
	}
}
