import { FormControl, Validators } from '@angular/forms';
import { AfterViewInit, ElementRef, Component, EventEmitter, OnInit, Output, TemplateRef, ViewChild, HostListener, Renderer2 } from '@angular/core';
import { Subscription, Observable, OperatorFunction, of, map } from 'rxjs';
import { debounceTime, distinctUntilChanged, switchMap } from 'rxjs/operators';
import { MatSelect } from '@angular/material/select';
import { ActivatedRoute, Router } from '@angular/router';
import { CodeUtility } from 'src/app/utilities/code.utility';
import { CdkDragDrop, moveItemInArray, transferArrayItem } from '@angular/cdk/drag-drop';
import { DialogService } from 'src/app/dialog/services/dialog.service';
import { NotificationService } from 'src/app/services/notification.service';
import { NgbModal, NgbModalRef } from '@ng-bootstrap/ng-bootstrap';
import { RefsetService } from 'src/app/services/rest/refset.service';
import { MT2Service } from 'src/app/services/mt2.service';
import { Title } from '@angular/platform-browser';
import { UiUtility } from 'src/app/utilities/ui.utility';
import { BreadcrumbService } from 'src/app/services/breadcrumb.service';
import { Debounce } from 'src/app/decorators/debounce.decorator';
import { User } from 'src/app/models/user';
import { AuthenticationService } from 'src/app/services/authentication/authentication.service';

@Component({
	selector: 'app-edit-mapping',
	templateUrl: './edit-mapping.component.html',
	styleUrls: ['./edit-mapping.component.scss'],
})
export class EditMappingComponent implements OnInit {
	user: User;
	targetCodeInput = '';
	targetNameInput = '';
	ruleBased = false;
	targetTerminology = '';
	targetTerminologyVersion = '';
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
	refsetGridApi: any;
	refsetGridColumnApi: any;
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
	downloadModalRef: NgbModalRef;
	confirmModalRef: NgbModalRef;
	isModalOpen = false;
	mapsetName = 'Mapset Name';
	selectedMapset: any;
	showConfigSection = true;
	showBrowserSection = false;
	mapsetCode: string;
	conceptCode: string;
	mapping: string;
	routeParamsSubscription$: Subscription;
	gridSelectAll = false;
	advicePopoverLocation = 0;
	removeId: any;
	removeType: string;
	loaded = false;
	selectedFormat = {};
	formats = [];
	numOfGroups = 0;
	groupList = [];
	foundConceptCode = false;
	selectedTarget = { 'id': '', 'group': 0, 'priority': 0 };
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
	rowColors = [{ 'background': 'white' }, { 'background': '#f2f2f2' }];
	currentRowColor = 0;
	stepperInfo: any = {};
	stepperStartInfo = {
		'READY_FOR_EDIT_COLOR': 'details-page-stepper-unstarted-step',
		'READY_FOR_EDIT_STARTED': false,
		'IN_EDIT_COLOR': 'details-page-stepper-unstarted-step',
		'IN_EDIT_STARTED': false,
		'READY_FOR_REVIEW_COLOR': 'details-page-stepper-unstarted-step',
		'READY_FOR_REVIEW_STARTED': false,
		'IN_REVIEW_COLOR': 'details-page-stepper-unstarted-step',
		'IN_REVIEW_STARTED': false,
		'REVIEW_COMPLETED_COLOR': 'details-page-stepper-unstarted-step',
		'REVIEW_COMPLETED_STARTED': false,
		'READY_FOR_PUBLICATION_COLOR': 'details-page-stepper-unstarted-step',
		'READY_FOR_PUBLICATION_STARTED': false,
	};

	moduleMetadata: any;
	refsetData: any;

	@Output() loadingSpinner = new EventEmitter<boolean>(true);

	@ViewChild('directoryInfoDialog') infoDialog: TemplateRef<any>;
	@ViewChild('directoryFeedbackDialog') feedbackDialog: TemplateRef<any>;
	@ViewChild('directoryActionSection') actionSection: TemplateRef<any>;
	@ViewChild('downloadModal') downloadModal: TemplateRef<any>;
	@ViewChild('confirmationModal') confirmationModal: TemplateRef<any>;
	@ViewChild('toBeDevelopedModal') tbdModal: TemplateRef<any>;
	@ViewChild('actions') private actions: MatSelect;
	@ViewChild('selectRelationship') private selectRelationship: MatSelect;
	@ViewChild('selectRule') private selectRule: MatSelect;
	@ViewChild('selectAdvice') private selectAdvice: MatSelect;
	@ViewChild('groupInput') private groupInput: ElementRef;
	@ViewChild('targetInput') private targetInput: ElementRef;

	constructor(
		private route: ActivatedRoute,
		private router: Router,
		private titleService: Title,
		private refsetService: RefsetService,
		private mt2Service: MT2Service,
		private renderer: Renderer2,
		private elementRef: ElementRef,
		private breadcrumbService: BreadcrumbService,
		private authenticationService: AuthenticationService,
		private notificationService: NotificationService,
		private modalService: NgbModal
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
		const stepperClass = 'details-page-stepper-started-step';
		this.stepperInfo = CodeUtility.clone(this.stepperStartInfo);
		//his.refsetStatus?.includes('IN_EDIT')) {
		this.stepperInfo['READY_FOR_EDIT_COLOR'] = stepperClass;
		this.stepperInfo['READY_FOR_EDIT_STARTED'] = true;
		this.stepperInfo['IN_EDIT_COLOR'] = stepperClass;
		this.stepperInfo['IN_EDIT_STARTED'] = true;

		this.targetFC.disable();
	}

	getMapsetInfo() {
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
		const projectId = '1';
		this.refsetService.getMapProjectById(projectId, params).subscribe({
			next: (results) => {
				this.targetTerminology = results.destinationTerminology;
				this.targetTerminologyVersion = results.destinationTerminologyVersion;
				this.ruleBased = results.ruleBased;
				this.projectRelations = results.mapRelations;
				const that = this;
				this.targetRelations = results.mapRelations
					.filter(function (res) {
						return res.allowableForNullTarget === false;
					})
					.map(function (res) {
						return that.titleCaseWord(res.name);
					});

				this.noTargetRelations = results.mapRelations
					.filter(function (res) {
						return res.allowableForNullTarget === true;
					})
					.map(function (res) {
						return that.titleCaseWord(res.name);
					});

				this.mapRelations = results.mapRelations.map((res) => {
					return this.titleCaseWord(res.name);
				});
				this.mapAdvices = results.mapAdvices.map((res) => {
					return res.name;
				});
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
			switchMap((term) => this.fetchData(term))
		);
	fetchData(term: string): Observable<any> {
		if (term.length >= 2 && !this.searchByKeyboard) {
			return this.refsetService.searchConceptByQuery(this.targetTerminology, this.targetTerminologyVersion, term, '10').pipe(map((data) => data.items));
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
							'index': results.code + count,
							'active': results.active,
							'spanned': spanned,
							'downloadable': true,
							'mapEntries': results.mapEntries,
							'descriptions': results.descriptions,
							'entries': results.mapEntries.length,
							'code': results.code,
							'name': results.name,
							'toName': results.mapEntries[b].toName.length > 0 && results.mapEntries[b].toName !== ' DOES NOT EXIST' ? results.mapEntries[b].toName : '---',
							'toCode':
								results.mapEntries[b].toCode.length > 0
									? results.mapEntries[b].group + '/' + results.mapEntries[b].priority + '#' + results.mapEntries[b].toCode
									: 'No map entries available.',
							'rule': results.mapEntries[b].rule.length > 0 ? results.mapEntries[b].rule : '---',
							'relation': results.mapEntries[b].relation.length > 0 ? results.mapEntries[b].relation.toUpperCase() : '---',
							'modified': results.mapEntries[b].modified,
							'advices': results.mapEntries[b].advices,
							'group': results.mapEntries[b].group,
							'groupTotal': results.mapEntries[b].group,
							'priority': results.mapEntries[b].priority,
							'moduleId': results.mapEntries[b].moduleId,
							'modFlag': this.getModuleLanguageIcon(results.mapEntries[b].moduleId),
							'modLang': this.getModuleLanguageName(results.mapEntries[b].moduleId),
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
		for (let r = 0; r < this.projectRelations.length; r++) {
			if (this.projectRelations[r].allowableForNullTarget === true) {
				defaultRelationship = this.titleCaseWord(this.projectRelations[r].name);
				break;
			}
		}
		const newMapEntry = {
			'active': true,
			'additionalMapEntryInfos': [],
			'mapAdvices': [],
			'adviceAlways': [],
			'advices': [],
			'descriptions': [],
			'block': 0,
			'created': null,
			'group': groupNum,
			'id': null,
			'modified': null,
			'modifiedBy': null,
			'moduleId': this.tempModuleIdChangeBeforeRelease,
			'modFlag': '',
			'modLang': '',
			'priority': nextPriorityNum,
			'relation': defaultRelationship,
			'rule': defaultRule,
			'toCode': '',
			'toName': '[NO TARGET]',
			'uuid': String(groupNum + nextPriorityNum + Date.now()),
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
		this.targetFC.enable();
		this.selectedTarget.id = uuid;
		this.selectedTarget.group = group;
		this.selectedTarget.priority = priority;
		this.targetCodeInput = code;
		this.targetNameInput = name === '[NO TARGET]' ? '' : name;
		this.targetFC.reset();
		this.targetFC.setValue(this.targetCodeInput);
		this.query = { 'code': this.targetCodeInput };
		this.targetInput.nativeElement.focus();
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
				'active': true,
				'additionalMapEntryInfos': [],
				'mapAdvices': [],
				'adviceAlways': [],
				'advices': [],
				'descriptions': [],
				'block': 0,
				'created': null,
				'group': this.numOfGroups,
				'id': null,
				'modified': null,
				'modifiedBy': null,
				'moduleId': this.tempModuleIdChangeBeforeRelease,
				'modFlag': '',
				'modLang': '',
				'priority': nextPriorityNum,
				'relation': defaultRelationship,
				'rule': defaultRule,
				'toCode': this.targetCodeInput,
				'toName': this.targetNameInput,
				'uuid': this.numOfGroups + nextPriorityNum + Date.now(),
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
			'code': this.mapsetData[0].code,
			'name': this.mapsetData[0].name,
			'active': this.mapsetData[0].active,
			'mapEntries': [],
		};

		for (let m = 0; m < this.mapsetData[0].mapEntries.length; m++) {
			const uiEntry = this.mapsetData[0].mapEntries[m];

			const mapEntry = {
				'advices': uiEntry.advices,
				'toCode': uiEntry.toCode,
				'toName': uiEntry.toName,
				'rule': uiEntry.rule,
				'priority': uiEntry.priority,
				'relation': uiEntry.relation.toUpperCase(),
				'group': uiEntry.group,
				'block': uiEntry.block,
				'moduleId': uiEntry.moduleId,
				'active': uiEntry.active,
				'additionalMapEntryInfos': uiEntry.additionalMapEntryInfos,
				'descriptions': uiEntry.descriptions,
				'id': uiEntry.id,
				'modified': uiEntry.modified,
				'created': uiEntry.created,
				'modifiedBy': uiEntry.modifiedBy,
			};
			saveMapset.mapEntries.push(mapEntry);
		}

		const params: any = {
			mapping: saveMapset,
			conceptCode: this.conceptCode,
		};

		this.userChanged = false;
		this.refsetService.updateMapsetMapping(this.mapsetCode, saveMapset).subscribe(
			(status) => {
				this.notificationService.show('The mapping has been saved.', null, 'success', { timeOut: 0, extendedTimeOut: 0 });
			},
			(error) => {
				//
			}
		);
	}

	showDropdown(): void {
		this.toggleDropdown = !this.toggleDropdown;
	}

	openGroupPopover(event: any, uuid: string) {
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

	startDownload() {
		this.closeDownloadModal();
		console.log('selected download format', this.selectedFormat['value']);
		this.openToBeDevelopedModal(this.tbdModal);
	}

	closeDownloadModal() {
		this.downloadModalRef.close();
		this.isModalOpen = false;
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
				this.router.navigate(['/mapset/' + this.mapsetCode + '/mapping/' + this.conceptCode], { replaceUrl: false, skipLocationChange: false });
		}
	}

	toggleSectionView(section: string) {
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
