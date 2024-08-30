import { FormControl } from '@angular/forms';
import { Subscription, debounceTime, distinctUntilChanged, Observable, forkJoin, filter, map } from 'rxjs';
import { AfterViewInit, ChangeDetectorRef, Component, EventEmitter, OnInit, Output, TemplateRef, ViewChild, HostListener } from '@angular/core';
import { MatSelect } from '@angular/material/select';
import { ActivatedRoute, Router } from '@angular/router';
import { ISelectCellEditorParams } from 'ag-grid-community';
import { DialogService } from 'src/app/dialog/services/dialog.service';
import { DialogFactoryService } from 'src/app/dialog/services/dialog-factory.service';
import { NotificationService } from 'src/app/services/notification.service';
import { NgbModal, NgbModalRef } from '@ng-bootstrap/ng-bootstrap';
import { RefsetService } from 'src/app/services/rest/refset.service';
import { Title } from '@angular/platform-browser';
import { UiUtility } from 'src/app/utilities/ui.utility';
import { BreadcrumbService } from 'src/app/services/breadcrumb.service';
import { CategoryFilterComponent } from 'src/app/components/categoryFilter/category-filter.component';
import { DateTextFilterComponent } from 'src/app/components/dateTextFilter/date-text-filter.component';
import { PaginationComponent } from 'src/app/components/pagination/pagination.component';
import { TemplateRendererComponent } from 'src/app/components/cellRenderers/template.renderer';
import { Debounce } from 'src/app/decorators/debounce.decorator';
import { User } from 'src/app/models/user';
import { AuthenticationService } from 'src/app/services/authentication/authentication.service';

@Component({
	selector: 'app-batch-mapping',
	templateUrl: './batch-mapping.component.html',
	styleUrls: ['./batch-mapping.component.scss'],
})
export class BatchMappingComponent implements OnInit, AfterViewInit {
	user: User;
	targetCodeInput = '';
	targetNameInput = '';
	ruleBased = false;
	ruleOptions = [];
	rulesTrue = ['TRUE'];
	rulesFalse = ['TRUE', 'Gender - Female', 'Gender - Male'];
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
	rowSelection = 'multiple';
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
	showLoadingSearch = true;
	toBeDevelopedModalRef: NgbModalRef;
	downloadModalRef: NgbModalRef;
	isModalOpen = false;
	mapsetName = 'Mapset Name';
	selectedMapset: any;
	showConfigSection = true;
	showBrowserSection = false;
	mapsetCode: string;
	conceptCodes: [];
	mapping: string;
	routeParamsSubscription$: Subscription;
	gridSelectAll = false;
	popoverLocationY = 0;
	popoverLocationX = 0;
	popover_uuid = '';
	popover_adviceToAdd = '';
	popover_updateAdviceList = [];
	popover_addAdviceList = [];
	selectedAction = '';
	loaded = false;
	selectedFormat = {};
	formats = [];
	numOfGroups = 1;
	foundConceptCode = false;
	selectedTarget = '';
	userChanged = false;
	showAdvicePopover = false;
	showGroupPopover = false;
	showTargetPopover = false;
	tempModuleIdChangeBeforeRelease = '449080006';

	targetFC = new FormControl('');
	groupFC = new FormControl('');
	priorityFC = new FormControl('');
	codeList: Observable<any[]>;
	targetToName = '';

	rowColors = [{ 'background': 'white' }, { 'background': '#f2f2f2' }];
	currentRowColor = 0;

	refsetData: any;
	gridOptions: any;
	gridPaging = { pageSize: 10, pageSizeOptions: [10, 25, 50, 100], totalKnown: false, totalRows: null, manualStateRefresh: true };
	gridParams: any;
	gridApi: any;
	gridColumnDefs = [];
	gridInterval: any;

	checkedNum = 0;

	@Output() loadingSpinner = new EventEmitter<boolean>(true);

	@ViewChild('selectRelationship') private selectRelationship: MatSelect;
	@ViewChild('selectRule') private selectRule: MatSelect;
	@ViewChild('selectAdvice') private selectAdvice: MatSelect;

	@ViewChild('directoryInfoDialog') infoDialog: TemplateRef<any>;
	@ViewChild('directoryFeedbackDialog') feedbackDialog: TemplateRef<any>;
	@ViewChild('toBeDevelopedModal') tbdModal: TemplateRef<any>;
	@ViewChild('directoryCheckSection') checkSection: TemplateRef<any>;
	@ViewChild('directoryInfoSection') infoSection: TemplateRef<any>;
	@ViewChild('directoryCodeSection') codeSection: TemplateRef<any>;
	@ViewChild('directoryNameSection') nameSection: TemplateRef<any>;
	@ViewChild('directoryToNameSection') toNameSection: TemplateRef<any>;
	@ViewChild('targetAdviceSection') adviceSection: TemplateRef<any>;
	@ViewChild('targetRelationshipSection') relationshipSection: TemplateRef<any>;
	@ViewChild('targetRuleSection') ruleSection: TemplateRef<any>;
	@ViewChild('directoryEditionSection') editionSection: TemplateRef<any>;
	@ViewChild('directoryActionSection') actionSection: TemplateRef<any>;
	@ViewChild('directoryPaging') paginationComponent: PaginationComponent;
	@ViewChild('directoryCategoryFilter') categoryFilter: TemplateRef<any>;
	@ViewChild('directoryWorkflowStatusSection') versionStatus: TemplateRef<any>;
	@ViewChild('downloadModal') downloadModal: TemplateRef<any>;
	@ViewChild('actions') private actions: MatSelect;

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

		this.groupFC.valueChanges.pipe(distinctUntilChanged()).subscribe((res) => {
			if (this.groupFC.dirty) {
				//this.foundConceptCode = false;
				//this.targetNameInput = '';
				//this.onInputTargetChange();
			}
		});
		this.priorityFC.valueChanges.pipe(distinctUntilChanged()).subscribe((res) => {
			if (this.priorityFC.dirty) {
				//this.foundConceptCode = false;
				//this.targetNameInput = '';
				//this.onInputTargetChange();
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
			console.log('routeParams.concepts', routeParams.concepts);
			this.conceptCodes = routeParams.concepts.split('_');
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

		this.gridOptions = {
			context: { componentParent: this },
			pagination: false,
			angularCompileHeaders: true,
			suppressColumnVirtualisation: false,
			suppressPaginationPanel: true,
			paginationPageSize: this.gridPaging.pageSize,
			rowSelection: 'single',
			enableCellTextSelection: true,
			onGridReady: this.onGridReady,
			frameworkComponents: {
				'templateRenderer': TemplateRendererComponent,
				'categoryFilterComponent': CategoryFilterComponent,
				'dateTextFilterComponent': DateTextFilterComponent,
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
				'refset_tool_grid_inactive_row': function (params) {
					let inactivatedRow = false;

					if (params.data) {
						inactivatedRow = params.data.active == false;
					}

					return inactivatedRow;
				},
			},
		};

		this.changeDetectorRef.detectChanges();

		this.gridInterval = setInterval(() => {
			//this.loadGridColumns();
			clearInterval(this.gridInterval);
		}, 5);
	}

	loadGridColumns(): void {
		this.gridColumnDefs = [
			{
				field: 'index',
				tooltipField: '',
				colId: 'checkbox',
				headerName: 'Check/Uncheck All',
				headerTooltip: 'Check/Uncheck All',
				minWidth: 55,
				width: 55,
				cellRenderer: TemplateRendererComponent,
				cellRendererParams: { template: this.checkSection },
				headerComponentParams: {
					template:
						'<div class="ag-cell-label-container" role="presentation">' +
						'  <span ref="eMenu" class="ag-header-icon ag-header-cell-menu-button"></span>' +
						'  <div ref="eLabel" class="ag-header-cell-label" role="presentation">' +
						'    <span ref="eSortOrder" class="ag-header-icon ag-sort-order"></span>' +
						'    <span ref="eSortAsc" class="ag-header-icon ag-sort-ascending-icon"></span>' +
						'    <span ref="eSortDesc" class="ag-header-icon ag-sort-descending-icon"></span>' +
						'    <span ref="eSortNone" class="ag-header-icon ag-sort-none-icon"></span>' +
						'    <label class="checkbox-override"><input type="checkbox" onclick="checkboxHandleClick()" id="checkbox-table-all" >' +
						'    <span class="checkbox-container"></span></label>' +
						'    <span ref="eFilter" class="ag-header-icon ag-filter-icon"></span>' +
						'  </div>' +
						'</div>',
				},
				unSortIcon: false,
				filter: false,
				resizable: false,
				sortable: false,
				suppressSorting: true,
				getQuickFilterText: (params) => {
					return '';
				},
			},

			{
				field: 'code',
				tooltipField: 'code',
				headerName: 'Source',
				headerTooltip: 'Source',
				flex: 1,
				minWidth: 125,
				cellClass: 'blue-link',
				resizable: true,
				sortable: false,
				suppressSorting: true,
			},
			{
				field: 'name',
				tooltipField: 'name',
				headerName: 'Source PT',
				headerTooltip: 'Source PT',
				flex: 2,
				resizable: true,
				minWidth: 165,
				cellRenderer: TemplateRendererComponent,
				cellRendererParams: { template: this.nameSection },
				sortable: false,
				unSortIcon: false,
				suppressSorting: true,
			},
			{
				field: 'toCode',
				headerName: 'Target',
				headerTooltip: 'Target',
				flex: 1,
				minWidth: 135,
				cellRenderer: TemplateRendererComponent,
				cellRendererParams: {
					template: this.codeSection,
				},
				resizable: true,
				unSortIcon: false,
				sortable: false,
				suppressSorting: true,
			},
			{
				field: 'toName',
				tooltipField: 'toName',
				headerName: 'Target PT',
				headerTooltip: 'Target PT',
				resizable: true,
				unSortIcon: true,
				sortable: false,
				suppressSorting: true,
				cellRenderer: TemplateRendererComponent,
				cellRendererParams: { template: this.toNameSection },
			},

			{
				field: 'relation',
				cellClass: 'editCell',
				tooltipField: 'relation',
				headerName: 'Relationship',
				headerTooltip: 'Relationship',
				resizable: true,
				/*	cellRenderer: TemplateRendererComponent,
				cellRendererParams: { template: this.relationshipSection },*/
				cellEditor: 'agSelectCellEditor',
				cellEditorParams: {
					values: this.targetRelations,
				},
				unSortIcon: true,
				sortable: false,
				suppressSorting: true,
				minWidth: 165,
				editable: true,
				width: 165,
			},
			{
				field: 'rule',
				cellClass: 'editCell',
				tooltipField: 'rule',
				headerName: 'Rule',
				headerTooltip: 'Rule',
				minWidth: 125,
				width: 125,
				resizable: true,
				//cellRenderer: TemplateRendererComponent,
				//cellRendererParams: { template: this.ruleSection },
				cellEditor: 'agSelectCellEditor',
				cellEditorParams: {
					values: this.ruleOptions,
				},
				editable: true,
				unSortIcon: true,
				sortable: false,
				suppressSorting: true,
			},
			{
				field: 'mapEntries',
				headerName: 'Advices',
				headerTooltip: 'Advices',
				cellClass: 'rt2-directory-column-version-date',
				minWidth: 165,
				width: 165,
				resizable: true,
				cellRenderer: TemplateRendererComponent,
				cellRendererParams: { template: this.adviceSection },
				unSortIcon: true,
				sortable: false,
				suppressSorting: true,
			},
			{
				field: 'modified',
				tooltipValueGetter: UiUtility.gridDateValueGetter,
				headerName: 'Last Modified',
				headerTooltip: 'Last Modified',
				cellClass: 'rt2-directory-column-modified-date',
				minWidth: 65,
				width: 145,
				resizable: true,
				valueGetter: UiUtility.gridDateValueGetter,
				floatingFilterComponent: DateTextFilterComponent,
				floatingFilterComponentParams: { suppressFilterButton: true },
				unSortIcon: true,
				sortable: false,
				suppressSorting: true,
			},
			{
				field: 'downloadable',
				colId: 'action-btns',
				headerName: '',
				width: 60,
				cellClass: 'rt2-directory-column-actions',
				cellRenderer: TemplateRendererComponent,
				cellRendererParams: { template: this.actionSection },
				sortable: false,
				filter: false,
				resizable: false,
				suppressSorting: true,
				getQuickFilterText: (params) => {
					return '';
				},
			},
		];
	}

	onGridReady = (params) => {
		this.gridParams = params;
		this.gridApi = params.api;
	};

	onGridCellClick = (event) => {
		const selectedRows = this.gridApi.getSelectedRows();
		const router = this.router;
		selectedRows.forEach(function (selectedRow, index) {
			router.navigate(['/personal/' + selectedRow.id + '/landing'], { replaceUrl: false, skipLocationChange: false });
			return;
		});
	};

	showParams(params) {
		console.log('paras ', params);
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
				this.ruleOptions = this.ruleBased ? this.rulesFalse : this.rulesTrue;
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

				this.loadGridColumns();
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
		this.targetToName = '';
		this.targetNameInput = '';
	}

	@Debounce()
	onInputTargetChange() {
		this.targetCodeInput = this.targetFC.value;
		this.targetCodeInput = this.targetCodeInput.trim();
		if (this.targetCodeInput.length > 2) {
			this.targetToName = 'Searching...';
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
				this.targetToName = results.name;
			},
			error: (error) => {
				//
			},
		});
	}

	getMapsetData() {
		this.refsetService.getMappingByMapsetConceptList(this.mapsetCode, this.conceptCodes.join(',')).subscribe({
			next: (response) => {
				this.loaded = true;
				const batch = [];
				const list = response.items;

				console.log(' loading list ', list);
				for (let i = 0; i < list.length; i++) {
					const results = list[i];
					let data = {};
					let count = 0;
					for (let b = 0; b < results.mapEntries.length; b++) {
						//let spanned = false;
						//results.mapEntries[b].uuid = results.code + results.mapEntries[b].modified + b;
						//results.mapEntries[b].advices_open = false;
						/*if (results.mapEntries.length > 1) {
							if (b >= 1) {
								spanned = true;
							}
						}*/
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
						//if (!spanned) {
						data = {
							'uuid': results.code + results.mapEntries[b].modified + b,
							'index': results.code + count,
							'active': results.active,
							'downloadable': true,
							'mapEntries': results.mapEntries[b],
							'entries': results.mapEntries.length,
							'code': results.code,
							'name': results.name,
							'toName': results.mapEntries[b].toName.length > 0 && results.mapEntries[b].toName !== ' DOES NOT EXIST' ? results.mapEntries[b].toName : '---',
							'toCode':
								results.mapEntries[b].toCode.length > 0
									? results.mapEntries[b].group + '/' + results.mapEntries[b].priority + '#' + results.mapEntries[b].toCode
									: 'No map entries available.',
							'rule': results.mapEntries[b].rule.length > 0 ? results.mapEntries[b].rule : '---',
							'relation': results.mapEntries[b].relation.length > 0 ? this.titleCaseWord(results.mapEntries[b].relation) : '---',
							'modified': results.mapEntries[b].modified,
							'advices': results.mapEntries[b].advices,
							'advices_open': false,
							'group': results.mapEntries[b].group,
							'priority': results.mapEntries[b].priority,
						};
						count++;
						//}
						batch.push(data);
					}
				}
				this.mapsetData = batch;
				console.log('ms ', this.mapsetData);

				const lastIndex = document.getElementsByClassName('ag-header').length - 1;
				const child = document.getElementsByClassName('ag-header')[lastIndex];
				document.getElementById('directoryHeader').appendChild(child);

				this.breadcrumbService.setBreadcrumbs([
					{ path: '/library', label: 'Library' },
					{ path: '/mapset/' + this.mapsetCode + '/mappings', label: this.mapsetName },
					{ label: 'Batch Edit Mappings' },
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
			conceptCode: this.conceptCodes,
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

	editGroup(event: any, params: any): void {
		//const showInterval = setInterval(() => {
		console.log(' eve ', event);
		console.log(' params ', params);
		this.groupFC.reset();
		this.priorityFC.reset();
		this.selectedTarget = params.data.uuid;
		this.groupFC.setValue(params.data.mapEntries.group);
		this.priorityFC.setValue(params.data.mapEntries.priority);
		this.showGroupPopover = true;
		this.showAdvicePopover = false;
		this.showTargetPopover = false;
		this.popoverLocationY = event.y + 15;
		this.popoverLocationX = event.x - 140; /*
		this.popover_uuid = params.data.uuid;
		this.popover_adviceToAdd = '';
		this.popover_updateAdviceList = JSON.parse(JSON.stringify(params.data.mapEntries.mapAdvices));
		this.mapAdvices.forEach((map) => {
			let found = false;
			this.popover_updateAdviceList.forEach((advice) => {
				if (map === advice) {
					found = true;
				}
			});
			if (!found) {
				this.popover_addAdviceList.push(map);
			}
		});

		this.popover_addAdviceList.sort((a, b) => (a > b ? 1 : -1));
		this.popover_updateAdviceList.sort((a, b) => (a > b ? 1 : -1));*/
	}

	clearGroupInput() {
		this.groupFC.reset();
	}
	clearPriorityInput() {
		this.priorityFC.reset();
	}
	closeGroup() {
		this.showGroupPopover = false;
	}

	setGroup() {
		this.userChanged = true;
		this.mapsetData.forEach((data) => {
			if (data.uuid === this.selectedTarget) {
				data.toCode = this.groupFC.value + '/' + data.mapEntries.priority + '#' + data.mapEntries.toCode;
				data.mapEntries.group = this.groupFC.value;
				data.group = this.groupFC.value;
				data.mapEntries.priority = this.priorityFC.value;
				data.priority = this.priorityFC.value;
			}
		});
		this.gridApi.refreshCells(this.gridParams);
		this.closeGroup();
	}

	editTarget(event: any, params: any): void {
		//const showInterval = setInterval(() => {
		console.log(' eve ', event);
		console.log(' params ', params);
		this.targetFC.reset();
		this.selectedTarget = params.data.uuid;
		this.targetFC.setValue(params.data.mapEntries.toCode);
		this.targetToName = params.data.mapEntries.toName;
		this.showTargetPopover = true;
		this.showAdvicePopover = false;
		this.showGroupPopover = false;
		this.popoverLocationY = event.y + 15;
		this.popoverLocationX = event.x - 160; /*
		this.popover_uuid = params.data.uuid;
		this.popover_adviceToAdd = '';
		this.popover_updateAdviceList = JSON.parse(JSON.stringify(params.data.mapEntries.mapAdvices));
		this.mapAdvices.forEach((map) => {
			let found = false;
			this.popover_updateAdviceList.forEach((advice) => {
				if (map === advice) {
					found = true;
				}
			});
			if (!found) {
				this.popover_addAdviceList.push(map);
			}
		});

		this.popover_addAdviceList.sort((a, b) => (a > b ? 1 : -1));
		this.popover_updateAdviceList.sort((a, b) => (a > b ? 1 : -1));*/
	}
	closeTarget() {
		this.targetFC.reset();
		this.selectedTarget = '';
		this.showTargetPopover = false;
	}

	setEmptyTarget() {
		this.userChanged = true;
		this.mapsetData.forEach((data) => {
			if (data.uuid === this.selectedTarget) {
				data.mapEntries.toCode = '[Empty Target]';
				data.toCode = data.mapEntries.group + '/' + data.mapEntries.priority + '#' + '[Empty Target]';
				data.mapEntries.toName = '---';
				data.toName = '---';
			}
		});
		this.gridApi.refreshCells(this.gridParams);
		this.closeTarget();
	}

	setTarget() {
		this.userChanged = true;
		this.mapsetData.forEach((data) => {
			if (data.uuid === this.selectedTarget) {
				data.mapEntries.toCode = this.targetFC.value;
				data.toCode = data.mapEntries.group + '/' + data.mapEntries.priority + '#' + this.targetFC.value;
				data.mapEntries.toName = this.targetToName;
				data.toName = this.targetToName;
			}
		});
		this.gridApi.refreshCells(this.gridParams);
		this.closeTarget();
	}

	openPopover(event: any, params: any): void {
		//const showInterval = setInterval(() => {
		console.log(' eve ', event);
		this.showAdvicePopover = true;
		this.showGroupPopover = false;
		this.showTargetPopover = false;
		this.popoverLocationY = event.y + 15;
		this.popoverLocationX = event.x - 140;
		this.popover_uuid = params.data.uuid;
		this.popover_adviceToAdd = '';
		this.popover_updateAdviceList = JSON.parse(JSON.stringify(params.data.mapEntries.mapAdvices));
		this.mapAdvices.forEach((map) => {
			let found = false;
			this.popover_updateAdviceList.forEach((advice) => {
				if (map === advice) {
					found = true;
				}
			});
			if (!found) {
				this.popover_addAdviceList.push(map);
			}
		});

		this.popover_addAdviceList.sort((a, b) => (a > b ? 1 : -1));
		this.popover_updateAdviceList.sort((a, b) => (a > b ? 1 : -1));
		/*this.mapsetData.forEach((data) => {
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
	}*/
		//const minus = (this.mapsetData.length - params.data.index) * 70;
		//const table = this.mapsetData.length * 51;

		//this.advicePopoverLocation = 335; // + table; // - (this.mapsetData.length - params.data.index * 71);
		// - minus;
		//const showInterval = setInterval(() => {
		//	console.log('ppar', minus);
		/*	this.gridApi.forEachNode((node) => {
			console.log('no', node.data);
			if (node.data.advices_open) {
				node.data.advices_open = false;
			}
		});*/
		//params.data.advices_open = true;
		//console.log(' this.advicePopoverLocation ', this.advicePopoverLocation);
		//params.data.advice_top = true;
		//const main = this;
		/*const timeout = setTimeout(function () {
			let popHeight = 0;

			console.log(' this.advicePopoverLocation AT', main.advicePopoverLocation);
			popHeight = document.getElementById('advice-popover').offsetHeight;
			main.advicePopoverLocation = main.advicePopoverLocation - popHeight;
			console.log(' pos ', popHeight);
			console.log(' this.advicePopoverLocation T', main.advicePopoverLocation);
			clearTimeout(timeout);
		}, 2);*/
		//	params.data.advice_bottom = false;

		//this.advicePopoverLocation = 45;
		/*	let offsetRows = 2;
			if (popHeight > 100) {
				offsetRows = 3;
			}
			if (params.node.rowIndex > 0 && params.node.rowIndex + offsetRows >= this.gridApi.paginationGetPageSize()) {
				params.data.advice_bottom = true;
				params.data.advice_top = false;*/
		//this.advicePopoverLocation = 335 - popHeight + params.data.index * 51;

		//	this.advicePopoverLocation = Number(popHeight + 250);
		//}
		//	clearInterval(showInterval);
		//}, 1);
	}

	closePopover() {
		this.showAdvicePopover = false;
		//params.data.advices_open = false;
	}

	addAdviceToList(uuid: string) {
		this.userChanged = true;
		console.log(' this md ', this.mapsetData);
		//this.mapsetData.forEach((data) => {
		//data.mapEntries.forEach((entry) => {
		//if (data.uuid === uuid) {
		if (this.popover_adviceToAdd !== '') {
			this.popover_updateAdviceList.push(this.popover_adviceToAdd);
			this.popover_updateAdviceList.sort((a, b) => (a > b ? 1 : -1));
			this.popover_addAdviceList.splice(this.popover_addAdviceList.indexOf(this.popover_adviceToAdd), 1);
			this.popover_addAdviceList.sort((a, b) => (a > b ? 1 : -1));
			this.popover_adviceToAdd = null;
			this.popover_adviceToAdd = '';
		}
		//	}
		//});
		//	});
		this.selectAdvice.value = '';
	}

	removeAdviceFromList(advice: string) {
		this.userChanged = true;
		//this.mapsetData.forEach((data) => {
		//	data.mapEntries.forEach((entry) => {
		//		if (entry.uuid === this.popover_uuid) {
		this.popover_adviceToAdd = null;
		this.popover_adviceToAdd = '';
		this.popover_addAdviceList.push(advice);
		this.popover_addAdviceList.sort((a, b) => (a > b ? 1 : -1));
		this.popover_updateAdviceList.splice(this.popover_updateAdviceList.indexOf(advice), 1);
		this.popover_updateAdviceList.sort((a, b) => (a > b ? 1 : -1));
		//}
		//	});
		//	});
	}

	setAdvice() {
		this.userChanged = true;
		this.mapsetData.forEach((data) => {
			//data.mapEntries.forEach((entry) => {
			if (data.uuid === this.popover_uuid) {
				data.mapEntries.mapAdvices = JSON.parse(JSON.stringify(this.popover_updateAdviceList));
				data.mapEntries.advices = JSON.parse(JSON.stringify(data.mapEntries.mapAdvices));
				if (data.mapEntries.adviceAlways.length > 0) {
					data.mapEntries.advices.unshift(data.mapEntries.adviceAlways[0]);
				}

				//	entry.advices_open = false;
			}
			//	});
		});
		this.closePopover();
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
		switch (this.selectedAction) {
			case 'remove':
				this.userChanged = true;
				this.mapsetData = this.mapsetData.filter((map) => {
					return !map.checked;
				});
				break;
			default:
				this.openToBeDevelopedModal(this.tbdModal);
		}
		this.selectedAction = '';
		this.actions.value = this.selectedAction;
	}

	/* mappings table functions */
	checkboxRowSelect(event, index) {
		for (let d = 0; d < this.mapsetData.length; d++) {
			if (this.mapsetData[d].index === index) {
				if (this.mapsetData[d].checked === undefined) {
					this.mapsetData[d].checked = true;
				} else {
					if (!this.mapsetData[d].checked) {
						this.mapsetData[d].checked = true;
					} else {
						this.mapsetData[d].checked = false;
					}
				}
			}
		}
		this.checkedNum = 0;
		for (let c = 0; c < this.mapsetData.length; c++) {
			if (this.mapsetData[c].checked === true) {
				this.checkedNum++;
			}
		}
	}

	getValueLength(params): number {
		let number = 0;
		const value = params.getValue();
		if (value !== undefined) {
			number = value.number;
		}
		//remove 1 for 'ALWAYS'
		number--;
		return number;
	}

	getValueList(params): Array<any> {
		let list = [];
		const value = params.getValue();
		if (value !== undefined) {
			list = value.list;
		}
		return list;
	}

	/*end functions*/

	goToMappingPage() {
		const url = new URL(window.location.href);
		window.history.pushState({}, '', url.href);
		this.router.navigate([]).then((result) => {
			window.open('/mapset/' + this.mapsetCode + '/mappings', '_blank');
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
