import { FormControl } from '@angular/forms';
import { Subscription, debounceTime, distinctUntilChanged, Observable, forkJoin, filter, map } from 'rxjs';
import { AfterViewInit, ChangeDetectorRef, Component, EventEmitter, OnInit, Output, TemplateRef, ViewChild, HostListener } from '@angular/core';
import { MatSelect } from '@angular/material/select';
import { ActivatedRoute, Router } from '@angular/router';
import { DialogService } from 'src/app/dialog/services/dialog.service';
import { DialogFactoryService } from 'src/app/dialog/services/dialog-factory.service';
import { NotificationService } from 'src/app/services/notification.service';
import { NgbModal, NgbModalRef } from '@ng-bootstrap/ng-bootstrap';
import { RefsetService } from 'src/app/services/rest/refset.service';
import { Title } from '@angular/platform-browser';
import { UiUtility } from 'src/app/utilities/ui.utility';
import { BreadcrumbService } from 'src/app/services/breadcrumb.service';
import { PaginationComponent } from 'src/app/components/pagination/pagination.component';
import { Debounce } from 'src/app/decorators/debounce.decorator';
import { User } from 'src/app/models/user';
import { AuthenticationService } from 'src/app/services/authentication/authentication.service';

@Component({
	selector: 'app-edit-mapping',
	templateUrl: './edit-mapping.component.html',
	styleUrls: ['./edit-mapping.component.scss'],
})
export class EditMappingComponent implements OnInit, AfterViewInit {
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

	selectedAction = '';
	loaded = false;
	selectedFormat = {};
	formats = [];
	numOfGroups = 1;
	foundConceptCode = false;
	selectedTarget = '';
	userChanged = false;

	tempModuleIdChangeBeforeRelease = '449080006';

	targetFC = new FormControl('');
	codeList: Observable<any[]>;

	rowColors = [{ 'background': 'white' }, { 'background': '#f2f2f2' }];
	currentRowColor = 0;

	refsetData: any;

	@Output() loadingSpinner = new EventEmitter<boolean>(true);

	@ViewChild('directoryInfoDialog') infoDialog: TemplateRef<any>;
	@ViewChild('directoryFeedbackDialog') feedbackDialog: TemplateRef<any>;
	@ViewChild('directoryActionSection') actionSection: TemplateRef<any>;
	@ViewChild('downloadModal') downloadModal: TemplateRef<any>;
	@ViewChild('toBeDevelopedModal') tbdModal: TemplateRef<any>;

	constructor(
		private route: ActivatedRoute,
		private router: Router,
		private titleService: Title,
		private dialogFactoryService: DialogFactoryService,
		private refsetService: RefsetService,
		private changeDetectorRef: ChangeDetectorRef,
		private breadcrumbService: BreadcrumbService,
		private authenticationService: AuthenticationService,
		private notificationService: NotificationService,
		private modalService: NgbModal
	) {
		document.body.scrollTop = 0;
		this.targetFC.valueChanges.pipe(debounceTime(600), distinctUntilChanged()).subscribe((res) => {
			if (this.targetFC.dirty) {
				this.foundConceptCode = false;
				this.targetNameInput = '';
				this.onInputTargetChange();
			}
		});
		//setup for type-ahead search
		/*this.codeList = this.targetFC.valueChanges.pipe(
			debounceTime(600),
			distinctUntilChanged(),
			map((state) => this.filterStates(state))
		);*/
		//).subscribe((res) => {
		//	if (this.targetFC.dirty) {
		//		this.onInputTargetChange();
		//	}
		//	});
		//refsetService.getTaxonomyRoot();
	}

	//setup for type-ahead search
	/*constructor() {
		this.stateCtrl = new FormControl();
		this.filteredStates = this.stateCtrl.valueChanges.pipe(
		  startWith(''),
		  map((state) => (state ? this.filterStates(state) : this.states.slice()))
		);
	  }
	
	  filterStates(name: string) {
		return this.states.filter(
		  (state) =>
			state.name.toLowerCase().indexOf(name.toLowerCase()) === 0 
		);
	  }*/
	filterStates(name: string) {
		return this.codeList; //.filter((state) => state.name.toLowerCase().indexOf(name.toLowerCase()) === 0);
	}

	//***** Framework Functions *****/
	ngOnInit() {
		this.user = this.authenticationService.getUser();
		this.titleService.setTitle('Mapping Tool - Edit Map');

		this.routeParamsSubscription$ = this.route.params.subscribe((routeParams) => {
			this.mapsetCode = routeParams.code;
			this.conceptCode = routeParams.concept;
			this.getMapsetInfo();
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

	getMapProject() {
		const params: any = {
			includeMembers: false,
		};
		const projectId = '1';
		this.refsetService.getMapProjectById(projectId, params).subscribe({
			next: (results) => {
				this.targetTerminology = results.destinationTerminology.replace(/-/g, '');
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

	ngAfterViewInit() {
		this.getMapsetData();
	}

	clearTargetInput() {
		this.foundConceptCode = false;
		this.targetCodeInput = '';
		this.targetFC.reset();
		this.targetFC.setValue(this.targetCodeInput);
		this.targetNameInput = '';
	}

	@Debounce()
	onInputTargetChange() {
		this.targetCodeInput = this.targetFC.value;
		this.targetCodeInput = this.targetCodeInput.trim();
		if (this.targetCodeInput.length > 2) {
			this.getConceptByCode();
		}
	}

	reloadMapping() {
		this.loaded = false;
		this.userChanged = false;
		this.selectedTarget = '';
		this.clearTargetInput();
		this.getMapsetInfo();
		this.getMapsetData();
		const refreshInterval = setInterval(() => {
			this.notificationService.show('The changes have been removed.', null, 'success', { timeOut: 4500, extendedTimeOut: 0 });
			clearInterval(refreshInterval);
		}, 250);
	}

	getConceptByCode() {
		this.refsetService.getConceptByCode(this.targetTerminology, this.targetTerminologyVersion, this.targetCodeInput).subscribe({
			next: (results) => {
				if (results.name.indexOf('CONCEPT NOT FOUND') > -1) {
					this.foundConceptCode = false;
				} else {
					this.foundConceptCode = true;
				}
				this.targetNameInput = results.name;
			},
			error: (error) => {
				//
			},
		});
	}

	getMapsetData() {
		this.refsetService.getMappingByMapsetAndConcept(this.mapsetCode, this.conceptCode).subscribe({
			next: (results) => {
				this.loaded = true;
				const data = [];
				let count = 0;

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
					if (!spanned) {
						data.push({
							'index': results.code + count,
							'active': results.active,
							'spanned': spanned,
							'downloadable': true,
							'mapEntries': results.mapEntries,
							'entries': results.mapEntries.length,
							'code': results.code,
							'name': results.name,
							'toName': results.mapEntries[b].toName.length > 0 && results.mapEntries[b].toName !== ' DOES NOT EXIST' ? results.mapEntries[b].toName : '---',
							'toCode':
								results.mapEntries[b].toCode.length > 0
									? results.mapEntries[b].group + '/' + results.mapEntries.length + '#' + results.mapEntries[b].toCode
									: 'No map entries available.',
							'rule': results.mapEntries[b].rule.length > 0 ? results.mapEntries[b].rule : '---',
							'relation': results.mapEntries[b].relation.length > 0 ? results.mapEntries[b].relation.toUpperCase() : '---',
							'modified': results.mapEntries[b].modified,
							'advices': results.mapEntries[b].advices,
							'group': results.mapEntries[b].group,
							'priority': results.mapEntries[b].priority,
						});
						count++;
					}
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
	}

	removeMapGroup(groupNum: number) {
		this.mapsetData[0].mapEntries.forEach((entry, index) => {
			if (entry.group === groupNum) {
				this.mapsetData[0].mapEntries.splice(index, 1);
			}
		});
		this.numOfGroups--;
		this.userChanged = true;
	}

	addEmptyTargetToGroup(groupNum: number) {
		if (this.selectedTarget === '') {
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
				'block': 0,
				'created': null,
				'group': groupNum,
				'id': null,
				'modified': null,
				'modifiedBy': null,
				'moduleId': this.tempModuleIdChangeBeforeRelease,
				'priority': nextPriorityNum,
				'relation': defaultRelationship,
				'rule': defaultRule,
				'toCode': '',
				'toName': '[NO TARGET]',
				'uuid': groupNum + nextPriorityNum + Date.now(),
			};

			this.mapsetData[0].mapEntries.push(newMapEntry);
		} else {
			for (let p = 0; p < this.mapsetData[0].mapEntries.length; p++) {
				if (this.mapsetData[0].mapEntries[p].uuid === this.selectedTarget) {
					this.mapsetData[0].mapEntries[p].toCode = '';
					this.mapsetData[0].mapEntries[p].toName = '[NO TARGET]';
				}
			}
			this.selectedTarget = '';
			this.foundConceptCode = false;
			this.clearTargetInput();
		}
		this.userChanged = true;
	}

	removeTarget(uuid: string) {
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

	setSelectedTarget(uuid: string, code: string, name: string) {
		this.selectedTarget = uuid;
		this.targetCodeInput = code;
		this.targetNameInput = name;
		this.targetFC.reset();
		this.targetFC.setValue(this.targetCodeInput);
	}

	setTargetCode() {
		if (this.selectedTarget === '') {
			let nextPriorityNum = 1;
			for (let p = 0; p < this.mapsetData[0].mapEntries.length; p++) {
				if (this.mapsetData[0].mapEntries[p].group === this.numOfGroups) {
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
				'block': 0,
				'created': null,
				'group': this.numOfGroups,
				'id': null,
				'modified': null,
				'modifiedBy': null,
				'moduleId': this.tempModuleIdChangeBeforeRelease,
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
				if (this.mapsetData[0].mapEntries[p].uuid === this.selectedTarget) {
					this.mapsetData[0].mapEntries[p].toCode = this.targetCodeInput;
					this.mapsetData[0].mapEntries[p].toName = this.targetNameInput;
				}
			}
		}
		this.selectedTarget = '';
		this.foundConceptCode = false;
		this.clearTargetInput();
		this.userChanged = true;
	}

	userChangeSelection() {
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
		console.log('save for MapSet', saveMapset);
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

	openPopover(event: any, uuid: string) {
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
			this.advicePopoverLocation = event.layerY + event.offsetY;
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

	openDownloadModal(content) {
		this.downloadModalRef = this.modalService.open(content, { centered: true });
		this.isModalOpen = true;
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

	selectActionMenu() {
		const ddInterval = setInterval(() => {
			this.selectedAction = null;
			clearInterval(ddInterval);
		}, 1);
		this.openToBeDevelopedModal(this.tbdModal);
	}

	goToMappingPage() {
		const url = new URL(window.location.href);
		window.history.pushState({}, '', url.href);
		this.router.navigate([]).then((result) => {
			window.open('/mapset/' + this.mapsetCode + '/mapping/' + this.conceptCode, '_blank');
		});
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
