import { ChangeDetectorRef, Component, OnInit, TemplateRef, ViewChild } from '@angular/core';
import { Location } from '@angular/common';
import { ActivatedRoute, Router } from '@angular/router';
import { DialogService } from 'src/app/dialog/services/dialog.service';
import { DialogFactoryService } from 'src/app/dialog/services/dialog-factory.service';
import { TemplateRenderer } from 'src/app/components/cellRenderers/template.renderer';
import { RefsetService } from 'src/app/services/rest/refset.service';
import { RouterExtentionService } from 'src/app/services/routerExtention.service';
import { Title } from '@angular/platform-browser';
import { CodeUtility } from 'src/app/utilities/code.utility';
import { Debounce } from 'src/app/decorators/debounce.decorator';
import { UiUtility } from 'src/app/utilities/ui.utility';
import { BreadcrumbService } from 'src/app/services/breadcrumb.service';
import { PaginationComponent } from 'src/app/components/pagination/pagination.component';
import { TreeOptions } from 'src/app/models/tree-options.model';
import { RefsetUtility } from 'src/app/utilities/refset.utility';
import { Constants } from 'src/app/utilities/constants.utility';
import { forkJoin, Subject, Subscription } from 'rxjs';
import { TaxonomyTreeComponent } from 'src/app/components/taxonomy-tree/taxonomy-tree.component';
import { environment } from 'src/environments/environment';
import { WorkflowService } from '../services/workflow/workflow.service';
import { MatTableDataSource } from '@angular/material/table';
import { MatSort } from '@angular/material/sort';
import { NgbModal } from '@ng-bootstrap/ng-bootstrap';
import { DateTextFilterComponent } from 'src/app/components/dateTextFilter/date-text-filter.component';
import { take } from 'rxjs/operators';
import { ProjectsRefsetComponent } from './projects/refsets/projects-refset.component';
import { NotificationService } from '../services/notification.service';
import { User } from '../models/user';
import { AuthenticationService } from '../services/authentication/authentication.service';

/**
 * @title Tree with nested nodes
 */
@Component({
    selector: 'app-refset-details',
    templateUrl: 'refset-details.html',
    styleUrls: ['./refset-details.scss']
})

export class RefsetDetails implements OnInit {

    id: string;
    user: User;
    refsetId = '';
    versionDate = '';
    isIntensional = false;
    refsetBranchPath: string;
    refsetLoaded = new Subject<boolean>();
    refsetLoaded$ = this.refsetLoaded.asObservable();
    memberCacheLoaded = new Subject<boolean>();
    memberCacheLoaded$ = this.memberCacheLoaded.asObservable();
    membersReady = false;
    inEditButtonPrefix = '';
    tableSearchInput: string;
    versionOptions: any;
    selectedVersion: string;
    languageOptions = [
        {
            value:
                Constants.DEFAULT_ACCEPT_LANGUAGE +
                ':' +
                Constants.DEFAULT_LANGUAGE_TYPE,
            display:
                Constants.DEFAULT_LANGUAGE_CODE +
                ' (' +
                Constants.DEFAULT_LANGUAGE_TYPE +
                ')',
        },
    ];
    selectedTaxonomyLanguage: string =
        Constants.DEFAULT_ACCEPT_LANGUAGE +
        ':' +
        Constants.DEFAULT_LANGUAGE_TYPE;
    selectedTaxonomyLanguageIndex = 0;
    selectedConceptDetailLanguage: string =
        Constants.DEFAULT_ACCEPT_LANGUAGE +
        ':' +
        Constants.DEFAULT_LANGUAGE_TYPE;
    selectedConceptDetailLanguageIndex = 0;
    membersGridChooserManualStateRefresh: Boolean = Boolean(true);
    useDialog = false;
    selectedMembersListMode = 'table'; // taxonomy
    membersTableDisplay = 'inline-block';
    membersTaxonomyDisplay = 'none';
    membersGridApi: any;
    membersGridColumnApi: any;
    membersColumnDefs = [];
    membersGridOptions: any;
    membersGridPaging = {
        pageSize: 10,
        pageSizeOptions: [10, 25, 50, 100],
        totalKnown: false,
        totalRows: null,
        manualStateRefresh: Boolean(true),
    };
    membersGridLastQuery = '';
    membersGridLastFilter = '';
    membersGridLastSort = '';
    showTable: boolean;
    refsetData: any;
    membersGridData: any;
    membersTreeData: any;
    dialog: DialogService;
    conceptDetail: any = null;
    conceptDetailParents: any = [];
    conceptDetailChildren: any = [];
    conceptDescriptions: any = [];
    isConceptDetailsLoading = false;
    membersTaxonomyRoot: any[] = [];
    taxonomyManualStateRefresh: Boolean = Boolean(false);
    taxonomyOptions: TreeOptions = {
        useFsn: false,
        language: Constants.DEFAULT_ACCEPT_LANGUAGE,
    };
    conceptDetailsOptions: TreeOptions = {
        useFsn: false,
        language: Constants.DEFAULT_ACCEPT_LANGUAGE,
    };
    taxonomyButtonLabel = 'Loading...';
    taxonomySearchInput: string;
    taxonomySearchResults: any[] = [];
    showTaxonomySearchTable = false;
    taxonomySearchDisplay = 'none';
    taxonomySearchGridApi: any;
    taxonomySearchGridColumnApi: any;
    taxonomySearchColumnDefs = [];
    taxonomySearchGridOptions: any;
    taxonomySearchGridPaging = {
        pageSize: 10,
        pageSizeOptions: [10, 25, 50, 100],
        totalKnown: false,
        totalRows: null,
        manualStateRefresh: Boolean(true),
    };
    taxonomySearchGridLastFilter = '';
    taxonomySearchGridLastSort = '';
    originalGridParams: any;
    membersGridNumberOfResults: number;
    taxonomySearchNumberOfResults: number;
    openDiscussionCount: number;
    showFullNarrativeText = false;
    showFullNotesText = false;
    editMode = false;
    taxonomyGridParams: any;
    showLoadingSpinner = false;
    selectedConcept: any;
    editMetadataProperties: any;
    directUrl: string;
    numOfChildren = undefined;
    hideMetadataTable = false;
    hideWorkflowTable = true;
    workflowHistoryGridOptions: any;
    workflowHistoryColumnDefs: any;
    refsetStatus: string;
    updateToggled = false;
    showFlag = true;
    adminToggled = false;
    workflowHistoryDataSource: any;
    workflowHistoryNotes: string;
    displayedColumns: string[] = ['modified', 'userName', 'workflowStatus', 'notes'];
    isConceptBeingAdded: boolean;
    addRemoveDefinitionExceptionType: string;
    conceptForAddRemove: any;
    reviewNotesAdded = false;
    allowedToEdit = false;
    allowedToReview = false;
    adminOverride = false;
    adminOverrideText = '';
    showMembersSection = true;
    noMemberSectionText = '';
    isLocked = false;
    membersSearchCallArray = [];
    taxonomySearchCallArray = [];
    uiUtility = UiUtility;
    localsetPublishValid = true;
    stepperInfo: any = {};
    changeRefsetStatusText: string;
    changeRefsetStatusButtonText: string;
    eclString: any;
    routeParamsSubscription$: Subscription;
    activeInactiveStatus = 'both';
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

    @ViewChild('detailsActionSection') actionSection: TemplateRef<any>;
    @ViewChild('detailsRichTextDialog') richTextDialog: TemplateRef<any>;
    @ViewChild('detailsMembersPaging') membersPaginationComponent: PaginationComponent;
    @ViewChild('changeRefsetStatusDialog') changeRefsetStatusDialog: TemplateRef<any>;
    @ViewChild('convertRefsetDialog') convertRefsetDialog: TemplateRef<any>;
    @ViewChild('refsetVersionNotes') refsetVersionNotes: TemplateRef<any>;
    @ViewChild('publishLocalsetDialog') publishLocalsetDialog: TemplateRef<any>;
    @ViewChild('memberHistoryDialog') memberHistoryDialog: TemplateRef<any>;
    @ViewChild('detailsMembersTaxonomy') taxonomyMembersComponent: TaxonomyTreeComponent;
    @ViewChild('taxonomySearchPaginationComponent') taxonomySearchPaginationComponent: PaginationComponent;
    @ViewChild('taxonomyResultSection') taxonomyResultSection: TemplateRef<any>;
    @ViewChild('taxonomyPathSection') taxonomyPathSection: TemplateRef<any>;
    @ViewChild('conceptCodeSection') conceptCodeSection: TemplateRef<any>;
    @ViewChild('importFromListDialog') importFromListDialog: TemplateRef<any>;
    @ViewChild(MatSort) sort: MatSort;

    constructor(
        private route: ActivatedRoute,
        private router: Router,
        private titleService: Title,
        private dialogFactoryService: DialogFactoryService,
        private refsetService: RefsetService,
        private changeDetectorRef: ChangeDetectorRef,
        private breadcrumbService: BreadcrumbService,
        private readonly workflowService: WorkflowService,
        private notificationService: NotificationService,
        private readonly modalService: NgbModal,
        private routerExtentionService: RouterExtentionService,
        readonly projectsRefsetComponent: ProjectsRefsetComponent,
        private location: Location,
        private authenticationService: AuthenticationService
    ) {
        document.body.scrollTop = 0;
        refsetService.getTaxonomyRoot();
    }

    get displayOutdateWarning(): boolean {
        const data = this.refsetData;
        return data && data.upgradeWarning && data.availableActions?.includes('CANCEL_EDIT') && !data.availableActions?.includes('EDIT');
    }

    get conceptDescriptionTerm(): string {
        const desc = this.conceptDescriptions.filter((desc) => this.getConceptDetailLanguageWithoutType().indexOf('-' + desc.languageCode) > -1 && desc.type == this.getConceptDetailLanguageType());
        return (desc.length > 0 ? desc[0] : this.conceptDescriptions[0]).term;
    }

    // ***** Framework Functions *****/
    ngOnInit() {
        this.user = this.authenticationService.getUser();
        Object.freeze(this.stepperStartInfo);

        this.routeParamsSubscription$ = this.route.params.subscribe(routeParams => {

            this.refsetId = routeParams.refsetId;
            this.versionDate = routeParams.versionDate;
            this.initializeDetailsPage();
        });
    }

    initializeDetailsPage() {

        this.editMode = false;
        this.isLocked = false;
        this.showFlag = true;
        this.adminOverride = false;
        this.adminOverrideText = '';
        this.refsetLoaded = new Subject<boolean>();
        this.refsetLoaded$ = this.refsetLoaded.asObservable();
        this.memberCacheLoaded = new Subject<boolean>();
        this.memberCacheLoaded$ = this.memberCacheLoaded.asObservable();
        this.showLoadingSpinner = true;
        this.inEditButtonPrefix = '';
        this.directUrl = (window.location.protocol + '//' + window.location.host + this.router.url);
        const prevUrl = this.routerExtentionService.getPreviousUrl();
        let isProjects = false;
        const parentRouteKey = 'currentRefsetParentRoute';

        this.refsetLoaded$.pipe(take(1)).subscribe((loaded) => {

            if (prevUrl && prevUrl != this.router.url) {
                sessionStorage.setItem(parentRouteKey, prevUrl);
            }
            const parent = sessionStorage.getItem(parentRouteKey);
            if (parent && parent.includes('projects')) {
                isProjects = true;
            }

            if (isProjects) {
                this.breadcrumbService.setBreadcrumbs([
                    {
                        path: '/organization/' + this.refsetData.project.edition.organizationId + '/edition/' + this.refsetData.project.edition.id + '/projects/' + this.refsetData.project.id + '/refsets',
                        label: 'Projects'
                    },
                    { label: 'Reference Set Details' },
                ]);
            } else {
                this.breadcrumbService.setBreadcrumbs([
                    { path: '/library', label: 'Reference Set Library' },
                    { label: 'Reference Set Details' },
                ]);
            }

            this.membersGridOptions = {
                context: { componentParent: this },
                pagination: true,
                suppressColumnVirtualisation: false, // need this so you can access rows and cells that might not be currently visible, including if the grid is hidden
                suppressPaginationPanel: true,
                paginationPageSize: this.membersGridPaging.pageSize,
                rowSelection: 'single',
                enableCellTextSelection: true,
                onCellClicked: this.onMembersGridCellClick,
                onGridReady: this.onMembersGridReady,
                onNewColumnsLoaded: this.onMembersColumnsLoaded.bind(this),
                frameworkComponents: {
                    templateRenderer: TemplateRenderer,
                    'dateTextFilterComponent': DateTextFilterComponent
                },
                defaultColDef: {
                    sortable: true,
                    resizable: true,
                    suppressMenu: false,
                    sortingOrder: ['asc', 'desc'],
                    filter: true,
                    floatingFilter: true,
                    floatingFilterComponentParams: { placeholder: '', suppressFilterButton: true },
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

            this.showLoadingSpinner = false;
            this.showTable = true;
            // If the member grid data is present manually reload the grid or it won't update
            if (CodeUtility.hasValue(this.originalGridParams)) {
                this.onMembersGridReady(this.originalGridParams);
            }

            // If concept details is loaded manually reload it
            if (CodeUtility.hasValue(this.conceptDetail)) {
                this.loadConceptDetail(this.conceptDetail);
            }
        });

        this.loadTaxonomy();
        this.loadRefset();
        this.cacheTaxonomyAncestors();
    }

    loadRefset(): void {

        this.refsetService.getRefset(this.refsetId, this.versionDate).subscribe({
            next: (results) => {
                this.refsetStatus = results?.workflowStatus;
                this.id = results?.id;
                this.isIntensional = results?.type == Constants.INTENSIONAL;
                this.refsetBranchPath = RefsetUtility.getBranchPath(results);
                this.refsetData = results;
                const channel = new BroadcastChannel('refsetDataChannel');
                channel.postMessage(UiUtility.getRoleString(this.refsetData.roles));
                this.refsetService.setRefsetInformation(this.refsetData);
                this.allowedToEdit = false;
                this.allowedToReview = false;
                this.changeDetectorRef.detectChanges();

                if (this.refsetData.type === Constants.EXTERNAL) {

                    this.showMembersSection = false;
                    this.noMemberSectionText = 'The Reference Set members are not available here for external refsets.';
                    this.membersReady = true;
                } else {
                    this.showMembersSection = true;
                }

                if ((this.refsetData.versionStatus == Constants.IN_DEVELOPMENT && this.refsetData?.roles?.includes('VIEWER')) ||
                    (this.refsetData?.roles?.includes('AUTHOR') && !this.refsetData?.hasVersionInDevelopment && this.refsetData?.latestPublishedVersion)) {
                    this.editMode = true;
                }

                if (this.editMode) {

                    this.refreshWorkflow();
                    this.editMetadataProperties = {
                        project: this.refsetData.project,
                        metadataConcept: this.refsetData.name,
                        parentConcept: this.refsetData.parentConceptId,
                        narrative: this.refsetData.narrative,
                        tags: this.refsetData.tags,
                        referenceType: this.refsetData.type,
                        privateRefset: this.refsetData.privateRefset,
                        localSet: this.refsetData.localSet,
                        versionDate: this.refsetData.versionDate,
                        versionNotes: this.refsetData.versionNotes,
                        moduleId: this.refsetData.moduleId
                    };

                    if (this.refsetData.type === Constants.INTENSIONAL) {
                        this.editMetadataProperties.definitionClauses = this.refsetData.definitionClauses;
                    }
                }

                this.refsetService.getDiscussionThreads('REFSET', this.id, null).subscribe({
                    next: (threads) => {
                        this.openDiscussionCount = 0;
                        for (const discussion of threads.items.filter(t => !t.privateThread ||
                            t.posts.length > 0 && (t.posts[0].user.userName === this.user.userName || this.user?.roles?.includes('all-all-admin')))) {

                            if (discussion.status === 'Open') {
                                this.openDiscussionCount++;
                            }
                        }
                    }
                });

                for (const description of this.refsetData.descriptions) {

                    if (description) {
                        description.flagIcon = RefsetUtility.getLanguageRefsetFlagIcon(description.languageCode);
                    }
                }

                this.refsetData.status = RefsetUtility.getStatus(this.refsetData.active);
                this.titleService.setTitle('Reference Set Tool - Reference Set Details: ' + this.refsetId);

                const languages = this.refsetData?.edition?.fullyQualifiedLanguageRefsets;
                const languageRefsetOptions = [];

                this.refsetData.versionDate = CodeUtility.formatJsonDate(this.refsetData?.versionDate, CodeUtility.DATE_FORMAT_REVERSE);
                this.versionOptions = RefsetUtility.getVersionOptions(this.refsetData, 'date');
                this.refsetData.flagIcon = RefsetUtility.getEditionFlagIcon(this.refsetData.edition.branch);

                if (this.refsetData.versionStatus != Constants.IN_DEVELOPMENT) {
                    this.selectedVersion = this.refsetData.versionDate;
                } else {
                    this.selectedVersion = Constants.IN_DEVELOPMENT;
                }

                for (const language of languages) {

                    let type = 'PT';

                    if (language.qualifiedLanguageCode.indexOf('FSN') >= 0) {
                        type = 'FSN';
                    }

                    const languageValue = language.languageCode + '-X-' + language.languageRefset + ':' + type;

                    if (CodeUtility.testBoolean(language.default) && !this.selectedTaxonomyLanguage) {
                        this.selectedTaxonomyLanguage = languageValue;
                    }

                    languageRefsetOptions.push({ value: languageValue, display: language.qualifiedLanguageCode });
                }

                if (languageRefsetOptions.length > 0) {
                    this.languageOptions = languageRefsetOptions;
                }
                this.taxonomyOptions.useFsn = this.getTaxonomyLanguageType().toLowerCase() == 'fsn';
                this.taxonomyOptions.language = this.getTaxonomyLanguageWithoutType();

                if (this.refsetData.active) {

                    this.changeRefsetStatusButtonText = "Inactivate";
                    this.changeRefsetStatusText = "You are about to inactivate this reference set, preventing it from being used in future published versions of the terminiology. You will be able to reactivate it."
                } else {

                    this.changeRefsetStatusButtonText = "Reactivate";
                    this.changeRefsetStatusText = "You are about to reactivate this reference set, allowing it to be used in future published versions of the terminiology."
                }

                if (CodeUtility.hasValue(this.refsetData)) {
                    this.shortenNoteFields();
                } else {
                    console.log('Error loading Reference Set details data.');
                }

                if (this.refsetData.locked) {
                    this.changeLockedStatus(true);
                } else {

                    this.refsetLoaded.next(true);
                    this.refsetLoaded.complete();
                }

                this.loadWorkflowHistoryData();

                this.showLoadingSpinner = false;
            },
            error: (error) => {
                this.toggleLoadingSpinner(false);
            }
        });
    }

    refreshWorkflow() {

        if (this.editMode) {

            this.stepperInfo = CodeUtility.clone(this.stepperStartInfo);
            const stepperClass = 'details-page-stepper-started-step';

            if (this.refsetStatus?.includes('READY_FOR_EDIT')) {

                this.stepperInfo['READY_FOR_EDIT_COLOR'] = stepperClass;
                this.stepperInfo['READY_FOR_EDIT_STARTED'] = true;

            } else if (this.refsetStatus?.includes('IN_EDIT')) {

                this.stepperInfo['READY_FOR_EDIT_COLOR'] = stepperClass;
                this.stepperInfo['READY_FOR_EDIT_STARTED'] = true;
                this.stepperInfo['IN_EDIT_COLOR'] = stepperClass;
                this.stepperInfo['IN_EDIT_STARTED'] = true;

                if (this.refsetData.roles.includes('ADMIN') && !this.refsetData.roles.includes('AUTHOR')) {

                    this.adminOverride = true;
                    this.adminOverrideText = "Admin ";
                }

            } else if (this.refsetStatus?.includes('READY_FOR_REVIEW')) {

                this.stepperInfo['READY_FOR_EDIT_COLOR'] = stepperClass;
                this.stepperInfo['READY_FOR_EDIT_STARTED'] = true;
                this.stepperInfo['IN_EDIT_COLOR'] = stepperClass;
                this.stepperInfo['IN_EDIT_STARTED'] = true;
                this.stepperInfo['READY_FOR_REVIEW_COLOR'] = stepperClass;
                this.stepperInfo['READY_FOR_REVIEW_STARTED'] = true;

            } else if (this.refsetStatus?.includes('IN_REVIEW')) {

                this.stepperInfo['READY_FOR_EDIT_COLOR'] = stepperClass;
                this.stepperInfo['READY_FOR_EDIT_STARTED'] = true;
                this.stepperInfo['IN_EDIT_COLOR'] = stepperClass;
                this.stepperInfo['IN_EDIT_STARTED'] = true;
                this.stepperInfo['READY_FOR_REVIEW_COLOR'] = stepperClass;
                this.stepperInfo['READY_FOR_REVIEW_STARTED'] = true;
                this.stepperInfo['IN_REVIEW_COLOR'] = stepperClass;
                this.stepperInfo['IN_REVIEW_STARTED'] = true;

                if (this.refsetData.roles.includes('ADMIN') && !this.refsetData.roles.includes('REVIEWER')) {

                    this.adminOverride = true;
                    this.adminOverrideText = "Admin ";
                }

            } else if (this.refsetStatus?.includes('REVIEW_COMPLETED')) {

                this.stepperInfo['READY_FOR_EDIT_COLOR'] = stepperClass;
                this.stepperInfo['READY_FOR_EDIT_STARTED'] = true;
                this.stepperInfo['IN_EDIT_COLOR'] = stepperClass;
                this.stepperInfo['IN_EDIT_STARTED'] = true;
                this.stepperInfo['READY_FOR_REVIEW_COLOR'] = stepperClass;
                this.stepperInfo['READY_FOR_REVIEW_STARTED'] = true;
                this.stepperInfo['IN_REVIEW_COLOR'] = stepperClass;
                this.stepperInfo['IN_REVIEW_STARTED'] = true;
                this.stepperInfo['REVIEW_COMPLETED_COLOR'] = stepperClass;
                this.stepperInfo['REVIEW_COMPLETED_STARTED'] = true;

            } else if (this.refsetStatus?.includes('READY_FOR_PUBLICATION')) {

                this.stepperInfo['READY_FOR_EDIT_COLOR'] = stepperClass;
                this.stepperInfo['READY_FOR_EDIT_STARTED'] = true;
                this.stepperInfo['IN_EDIT_COLOR'] = stepperClass;
                this.stepperInfo['IN_EDIT_STARTED'] = true;
                this.stepperInfo['READY_FOR_REVIEW_COLOR'] = stepperClass;
                this.stepperInfo['READY_FOR_REVIEW_STARTED'] = true;
                this.stepperInfo['IN_REVIEW_COLOR'] = stepperClass;
                this.stepperInfo['IN_REVIEW_STARTED'] = true;
                this.stepperInfo['REVIEW_COMPLETED_COLOR'] = stepperClass;
                this.stepperInfo['REVIEW_COMPLETED_STARTED'] = true;
                this.stepperInfo['READY_FOR_PUBLICATION_COLOR'] = stepperClass;
                this.stepperInfo['READY_FOR_PUBLICATION_STARTED'] = true;

            }

            if (this.refsetData?.availableActions?.includes('FINISH_EDIT')) {

                this.allowedToEdit = true;
                this.inEditButtonPrefix = 'Save and ';

            } else if (this.refsetData?.availableActions?.includes('ACCEPT_REVIEW')) {
                this.allowedToReview = true;

            }

            // if you aren't the assigned author of an IN_EDIT or IN_UPGRADE refset then you can't see the members
            if (this.refsetData.assignedUser != this.user.userName && ['IN_EDIT', 'IN_UPGRADE'].includes(this.refsetData?.workflowStatus)) {

                this.showMembersSection = false;
                this.noMemberSectionText = 'The Reference Set members are unavailable while another author is making changes.';
                this.membersReady = true;
            }
        }
    }

    ngOnDestroy() {
        this.routeParamsSubscription$.unsubscribe();
    }

    // ***** Members Taxonomy Functions  *****/
    loadTaxonomy() {

        const allObservables = {
            refsetLoaded: this.refsetLoaded$,
            memberCacheLoaded: this.memberCacheLoaded
        };

        // call forkJoin on returned observables
        forkJoin(allObservables).pipe(take(1)).subscribe(({ refsetLoaded, memberCacheLoaded }) => {

            console.log('refsetLoaded: ' + refsetLoaded);
            console.log('memberCacheLoaded: ' + memberCacheLoaded);

            this.loadTaxonomyRoot();
            this.taxonomySearchColumnDefs = [
                {
                    field: 'code',
                    colId: 'code',
                    headerName: 'Concept ID',
                    minWidth: 65,
                    maxWidth: 140,
                    cellClass: 'rt2-taxonomy-search-column-name',
                    tooltipField: 'code', resizable: true
                },
                {
                    field: 'name',
                    colId: 'result',
                    headerName: 'Result',
                    minWidth: 65,
                    flex: 1,
                    cellClass: 'rt2-taxonomy-search-column-name',
                    valueGetter: this.taxonomyResultValueGetter.bind(this),
                    cellRenderer: 'templateRenderer',
                    cellRendererParams: {
                        template: this.taxonomyResultSection,
                    },
                    tooltipField: 'name',
                    comparator: (a, b) => a.localeCompare(b, undefined, { sensitivity: 'base' }), resizable: false
                },
            ];

            this.taxonomySearchGridOptions = {
                context: { componentParent: this },
                pagination: true,
                suppressColumnVirtualisation: false, // need this so you can access rows and cells that might not be currently visible, including if the grid is hidden
                suppressPaginationPanel: true,
                paginationPageSize: this.taxonomySearchGridPaging.pageSize,
                rowSelection: 'single',
                onCellClicked: this.onTaxonomySearchGridCellClick,
                onGridReady: this.onTaxonomySearchGridReady,
                frameworkComponents: {
                    templateRenderer: TemplateRenderer,
                },
                defaultColDef: {
                    sortable: false,
                    resizable: true,
                    suppressMenu: true,
                    floatingFilter: false,
                    filter: false,
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

        });
    }

    cacheTaxonomyAncestors() {

        this.refsetService.cacheMemberAncestors(this.refsetId, this.versionDate).subscribe({
            next: results => {

                const success = results?.success;

                if (!CodeUtility.testBoolean(success)) {
                    console.log('Error caching Reference Set member details.');
                }

                this.memberCacheLoaded.next(true);
                this.memberCacheLoaded.complete();
            },
            error: (error) => {
                this.toggleLoadingSpinner(false);
            }
        });
    }

    loadTaxonomyRoot() {

        const restParams = {
            displayType: 'taxonomy',
            returnStartingConcept: true,
            language: this.getTaxonomyLanguageWithoutType(),
            depth: 1,
            startingConceptId: Constants.SNOMED_ROOT_CONCEPT_ID,
            offset: 0,
            limit: 1000,
        };

        // load taxonomy root
        this.refsetService.getConceptList(this.refsetData.id, restParams).subscribe({
            next: (results) => {
                this.membersTaxonomyRoot = results.items[0];
                this.taxonomyButtonLabel = 'Taxonomy';
                this.showTaxonomySearchTable = true;
            },
            error: (error) => {
                this.toggleLoadingSpinner(false);
            }
        });
    }

    changeTaxonomyLanguage() {
        this.selectedTaxonomyLanguageIndex = this.languageOptions.findIndex(
            (option) => option.value === this.selectedTaxonomyLanguage
        );

        this.selectedConceptDetailLanguage = this.selectedTaxonomyLanguage;
        this.taxonomySearchGridApi?.refreshCells();
        this.taxonomyOptions.useFsn = this.conceptDetailsOptions.useFsn = this.getTaxonomyLanguageType().toLowerCase() == 'fsn';
        this.taxonomyOptions.language = this.conceptDetailsOptions.language = this.getTaxonomyLanguageWithoutType();

        // reload the members taxonomy tree
        // this.reloadTaxonomyTree();

        // if concept details is present reload the concept details child tree
        if (CodeUtility.hasValue(this.conceptDetail)) {

            delete this.conceptDetail.children;
            this.conceptDetail = CodeUtility.clone(this.conceptDetail);
            this.loadConceptDetailParents(this.conceptDetail);
        }
    }

    changeConceptDetailsLanguage() {

        this.selectedConceptDetailLanguageIndex = this.languageOptions.findIndex(
            (option) => option.value === this.selectedConceptDetailLanguage
        );

        this.conceptDetailsOptions.useFsn = this.getConceptDetailLanguageType().toLowerCase() == 'fsn';
        this.conceptDetailsOptions.language = this.getConceptDetailLanguageWithoutType();

        // if concept details is present reload the concept details child tree
        if (CodeUtility.hasValue(this.conceptDetail)) {

            delete this.conceptDetail.children;
            this.conceptDetail = CodeUtility.clone(this.conceptDetail);
            this.loadConceptDetailParents(this.conceptDetail, this.getConceptDetailLanguageWithoutType());
        }
    }

    getTaxonomyLanguageWithoutType() {
        return this.selectedConceptDetailLanguage.replace(/:.*$/, '');
    }

    getTaxonomyLanguageType() {
        return this.selectedConceptDetailLanguage.replace(/^.*:/, '');
    }

    getConceptDetailLanguageWithoutType() {
        return this.selectedConceptDetailLanguage.replace(/:.*$/, '');
    }

    getConceptDetailLanguageType() {
        return this.selectedConceptDetailLanguage.replace(/^.*:/, '');
    }

    onTaxonomySearchGridReady = (gridReadyParams) => {

        let searchTime = Date.now();
        this.taxonomySearchCallArray.push(searchTime);

        this.taxonomySearchGridApi = gridReadyParams?.api;
        this.taxonomySearchGridColumnApi = gridReadyParams?.columnApi;
        this.taxonomyGridParams = gridReadyParams;

        if (!CodeUtility.hasValue(this.taxonomySearchInput)) {

            this.taxonomySearchGridApi?.showNoRowsOverlay();
            this.taxonomySearchGridApi?.setRowData([]);
            return;
        }

        this.taxonomySearchGridApi?.showLoadingOverlay();

        let pageNumber = this.taxonomySearchGridApi?.paginationGetPageSize() + 1;
        let query = '';

        if (CodeUtility.hasValue(this.taxonomySearchInput) && this.taxonomySearchInput.length > 2) {
            query = CodeUtility.addIfNotEmpty(query, ' AND ') + this.taxonomySearchInput;
            query = query.replace(/\//g, ' ');
        }

        const newFilterString = query;

        // if the filters or sort have changed then move to the first page
        if (newFilterString !== this.taxonomySearchGridLastFilter) {

            pageNumber = 1;
            this.taxonomySearchGridPaging.totalRows = null;
            this.taxonomySearchGridPaging.totalKnown = false;
            this.taxonomySearchGridApi.api?.paginationGoToPage(0);
        }

        this.taxonomySearchGridLastFilter = newFilterString;

        const restParams: any = {
            limit: this.taxonomySearchGridApi?.paginationGetPageSize(),
            offset: pageNumber - 1,
        };

        if (CodeUtility.hasValue(query)) {
            restParams.query = query;
        }

        this.refsetService.getTaxonomySearch(this.id, restParams).subscribe({
            next: (results) => {

                // if this is not the latest search call then do not apply the results
                if (searchTime - this.taxonomySearchCallArray[this.taxonomySearchCallArray.length - 1] < 0) {
                    return;
                }

                this.taxonomySearchNumberOfResults = results.total;
                this.taxonomySearchResults = results.items;

                if (results.items.length == 0) {

                    this.taxonomySearchGridApi?.showNoRowsOverlay();
                    this.taxonomySearchGridApi?.setRowData([]);

                    if (pageNumber > 1) {

                        this.taxonomySearchGridPaging.totalRows = this.taxonomySearchGridApi?.paginationGetPageSize() * (pageNumber - 1);
                        this.taxonomySearchGridPaging.totalKnown = true;
                        this.taxonomySearchPaginationComponent.goToPage(pageNumber - 1);
                    }

                    return;
                }

                UiUtility.applyServerPagedGridResults(results, this.taxonomySearchGridApi, this.taxonomySearchGridPaging, pageNumber, null, false);
            },
            error: (error) => {

                this.taxonomySearchResults = [];
                this.taxonomySearchGridApi?.showNoRowsOverlay();
                this.taxonomySearchGridApi?.setRowData([]);
                //this.toggleLoadingSpinner(false);
            }
        });
    }

    taxonomyPathValueGetter = function (params) {

        if (!CodeUtility.hasValue(params.data)) {
            return '';
        }

        let pathString = '';

        for (const pathConcept of params.data.parents) {

            const parentText = this.getTaxonomySearchDescription(pathConcept);
            pathString = CodeUtility.addIfNotEmpty(pathString, ' > ') + parentText;
        }

        return pathString;
    };

    taxonomyResultValueGetter = function (params) {
        if (!CodeUtility.hasValue(params.data)) {
            return '';
        }

        return this.getTaxonomySearchDescription(params.data);
    };

    getTaxonomySearchDescription(concept) {

        let text = '';
        const choosenDescription = concept.descriptions[this.selectedTaxonomyLanguageIndex];

        if (choosenDescription != null) {
            text = choosenDescription.term;
        } else if (concept.descriptions[0] != null) {
            text = concept.descriptions[0].term;
        } else {
            text = concept.name;
        }

        return text;
    }

    onTaxonomySearchGridCellClick = (event) => {

        //this.toggleLoadingSpinner(true);
        this.taxonomySearchGridApi.showLoadingOverlay();
        const selectedRows = this.taxonomySearchGridApi?.getSelectedRows();
        let selectedConcept;

        selectedRows.forEach(function (selectedRow, index) {
            selectedConcept = selectedRow;
        });

        this.loadConceptDetail(selectedConcept);

        try {
            this.refsetService.getMemberAncestorConcepts(this.id, selectedConcept.code).subscribe((result) => {
                this.goToTaxonomyConcept(selectedConcept.code, result.parents);
            });
        } catch {
            this.taxonomySearchGridApi.hideLoadingOverlay();
            //this.toggleLoadingSpinner(false)
        }
    }

    @Debounce()
    onTaxonomySearchChange() {

        const showSearch = CodeUtility.hasValue(this.taxonomySearchInput) && (this.taxonomySearchResults.length > 0 || this.taxonomySearchInput.length > 2);

        if (showSearch) {

            this.taxonomySearchDisplay = 'block';

            if (this.taxonomySearchInput.length > 2) {
                this.onTaxonomySearchGridReady(this.taxonomyGridParams);
            }

        } else {
            this.taxonomySearchDisplay = 'none';
        }
    }

    goToTaxonomyConcept(selectedConcept, selectedPath) {

        const afterNodeFound = (node) => {
            this.taxonomySearchGridApi.hideOverlay();
        };

        this.taxonomyMembersComponent.findNodeInTree(selectedConcept, selectedPath, afterNodeFound, true, true);
        this.toggleLoadingSpinner(false)
    }

    reloadTaxonomyTree() {

        this.taxonomyManualStateRefresh = new Boolean('true');
        this.loadTaxonomyRoot();
    }

    // ***** Members Grid Functions *****/
    onMembersGridReady = (gridReadyParams) => {

        let searchTime = Date.now();
        this.membersSearchCallArray.push(searchTime);

        this.originalGridParams = gridReadyParams;
        this.membersGridApi = gridReadyParams.api;
        this.membersGridColumnApi = gridReadyParams.columnApi;

        this.membersGridApi.showLoadingOverlay();

        let pageNumber = this.membersGridApi.paginationGetCurrentPage() + 1;
        let query = '';

        if (CodeUtility.hasValue(this.tableSearchInput) && this.tableSearchInput.length > 2) {
            query = this.tableSearchInput;
            query = query.replace(/\//g, ' ');

        } else if (this.tableSearchInput && !CodeUtility.hasValue(this.tableSearchInput)) {

            this.membersGridApi.showNoRowsOverlay();
            this.membersGridApi.setRowData([]);
            return;
        }

        pageNumber = 1;
        this.membersGridPaging.totalRows = null;
        this.membersGridPaging.totalKnown = false;
        this.membersGridApi?.api?.paginationGoToPage(0);

        const restParams: any = {
            displayType: 'list',
            limit: this.membersGridApi.paginationGetPageSize(),
            offset: pageNumber - 1,
            countComments: true
        };

        if (CodeUtility.hasValue(query)) {
            restParams.query = query;
        }

        // if editing enable the return of hasChildren data in the list
        if (this.allowedToEdit) {
            restParams.editing = true;
        }
        this.membersReady = false;

        this.refsetService.getConceptList(this.id, restParams).subscribe({
            next: (results) => {

                // if this is not the latest search call then do not apply the results
                if (searchTime - this.membersSearchCallArray[this.membersSearchCallArray.length - 1] < 0) {
                    return;
                }

                const data = results.items
                this.membersGridData = data;
                this.membersGridNumberOfResults = data.length;

                results.items = data;

                if (data.length == 0) {

                    this.membersGridApi.showNoRowsOverlay();
                    this.membersGridApi.setRowData([]);

                    if (pageNumber > 1) {

                        this.membersGridPaging.totalRows = this.membersGridApi.paginationGetPageSize() * (pageNumber - 1);
                        this.membersGridPaging.totalKnown = true;
                        this.membersPaginationComponent.goToPage(pageNumber - 1);
                    }

                    this.membersReady = true;

                    return;
                }

                this.membersColumnDefs = [
                    // This column is an exception to resizable, it's the +/- icon column
                    {
                        field: 'active',
                        headerName: '',
                        maxWidth: 40,
                        resizable: true,
                        sort: false,
                        cellClass: 'rt2-details-column-remove-icon',
                        cellRenderer: 'templateRenderer',
                        cellRendererParams: { template: this.conceptCodeSection }
                    }, {
                        field: 'code', colId: 'code', headerName: 'Concept ID', minWidth: 65, maxWidth: 140, tooltipField: 'code', unSortIcon: true,
                        resizable: true, cellClass: 'rt2-details-column-concept-id'
                    }
                ];

                for (let i = 0; i < this.languageOptions.length; i++) {

                    const language = this.languageOptions[i];
                    const minWidth = 65;
                    // language.value === '101FSN' ? 250 : 190;

                    this.membersColumnDefs.push({
                        field: i.toString(),
                        flex: 1,
                        minWidth: minWidth,
                        colId: language.value,
                        headerName: language.display,
                        cellClass:
                            'rt2-details-column-description',
                        valueGetter: this.descriptionValueGetter,
                        unSortIcon: true,
                        tooltipValueGetter: this.descriptionValueGetter,
                        comparator: (a, b) => a.localeCompare(b, undefined, { sensitivity: 'base' }), resizable: true
                    });
                }

                this.membersColumnDefs.push(
                    ...[
                        {
                            field: 'memberEffectiveTime',
                            colId: 'modified',
                            flex: 1,
                            minWidth: 65,
                            maxWidth: 190,
                            headerName: 'Last Modified Date',
                            cellClass:
                                'rt2-details-column-modified-date',
                            valueGetter:
                                UiUtility.gridDateValueGetter,
                            tooltipValueGetter: UiUtility.gridDateValueGetter,
                            sort: 'desc',
                            unSortIcon: true,
                            floatingFilterComponent: 'dateTextFilterComponent',
                            floatingFilterComponentParams: { suppressFilterButton: true }, resizable: true
                        },
                        {
                            field: 'active',
                            colId: 'actions',
                            flex: 1,
                            headerName: '',
                            minWidth: 65,
                            cellClass:
                                'rt2-details-column-actions',
                            cellRenderer: 'templateRenderer',
                            cellRendererParams: {
                                template: this.actionSection,
                            },
                            filter: false,
                            tooltipField: 'active',
                            sortable: false,
                            resizable: false
                        },
                    ]
                );

                UiUtility.applyServerPagedGridResults(results, this.membersGridApi, this.membersGridPaging, pageNumber, null, false);
                this.membersReady = true;
                this.changeActiveInactiveStatus();
            },
            error: (error) => {

                this.membersGridApi.showNoRowsOverlay();
                this.membersGridApi.setRowData([]);
                this.toggleLoadingSpinner(false);
                this.membersReady = true;
            }

        });
    }

    changeActiveInactiveStatus(): void {

        let filters = this.membersGridApi.getFilterModel();

        if (this.activeInactiveStatus == 'active') {
            filters.active = { filterType: 'text', type: 'equals', filter: true };
        } else if (this.activeInactiveStatus == 'both') {
            delete filters.active;
        } else if (this.activeInactiveStatus == 'inactive') {
            filters.active = { filterType: 'text', type: 'equals', filter: false };
        }

        this.membersGridApi.setFilterModel(filters);
    }

    onMembersColumnsLoaded() {
        this.membersGridChooserManualStateRefresh = new Boolean(true);
        UiUtility.applyGridPlaceholders('.ag-floating-filter-input .ag-input-field-input');

    }

    descriptionValueGetter = function (params) {

        const term = params?.data?.descriptions[params.colDef.field]?.term;

        if (CodeUtility.hasValue(term)) {
            return term[0].toUpperCase() + term.slice(1);
        } else {
            return '';
        }
    };

    onMembersGridCellClick = (event) => {
        if (event.column.colId === 'actions') {

        } else {
            const selectedRows = this.membersGridApi.getSelectedRows();
            let selectedId: string;

            selectedRows.forEach(function (selectedRow, index) {
                selectedId = selectedRow.code;
            });

            const selectedConcept = this.getMemberRow(selectedId);
            this.loadConceptDetail(selectedConcept);
        }
    }

    @Debounce()
    onTableSearchChange() {
        if (
            !CodeUtility.hasValue(this.tableSearchInput) ||
            (CodeUtility.hasValue(this.tableSearchInput) &&
                this.tableSearchInput.length > 2)
        ) {
            this.onMembersGridReady(this.originalGridParams);
        }
    }

    getMembersGridPageSize() {

        let size = this.membersGridPaging.pageSize;

        if (this.membersGridApi) {
            size = this.membersGridApi.paginationGetPageSize();
        }
        return size;
    }

    // ***** General Functions *****/
    setWorkflowStatusByAction(notes: string, action: string): void {

        this.toggleLoadingSpinner(true);

        this.workflowService.setWorkflowStatusByAction(this.refsetData.id, this.refsetData.modifiedBy, action, notes).subscribe({
            next: (results) => {

                if (results) {

                    if (action.includes('UNASSIGN')) {
                        this.loadRefset();

                    } else if (this.refsetData.id != results.id) {
                        this.loadNewRefsetVersion(results.refsetId, RefsetUtility.getVersionDateForRefsetApiCall(results));

                    } else {

                        if (['CANCEL_EDIT', 'FINISH_UPGRADE'].includes(action)) {

                            this.processChangedMemberEffects(null);
                            this.loadRefset();
                        } else {
                            this.loadRefset();
                        }

                    }
                } else {
                    this.loadRefset();
                }
            },
            error: (error) => {
                this.toggleLoadingSpinner(false);
            }
        });
    }

    openPublishLocalsetModal = () => {

        this.localsetPublishValid = true;

        this.modalService.open(this.publishLocalsetDialog, {
            windowClass: 'ready-for-publication-modal',
            backdrop: 'static',
            keyboard: false
        });
    }

    publishLocalset = (versionDate: string) => {

        if (!this.validatePublishDate(versionDate)) {

            this.localsetPublishValid = false;
            return;
        }

        this.toggleLoadingSpinner(true);

        this.refsetService.publishLocalset(this.refsetData.id, versionDate).subscribe({
            next: (results) => {

                if (results) {
                    this.loadNewRefsetVersion(results.refsetId, RefsetUtility.getVersionDateForRefsetApiCall(results));
                }
            },
            error: (error) => {
                this.toggleLoadingSpinner(false);
            }
        });

        this.modalService.dismissAll();
    }

    validatePublishDate = (date: string) => {

        let a = CodeUtility.DATE_FORMAT_REVERSE_ONLY_NUMBERS;
        let b = Constants.EXCLUSION;
        let c = UiUtility.getIconImageUrl("test");

        if (date == "" || !CodeUtility.isDateValid(date) || CodeUtility.compareDates(date, "2000-01-01", CodeUtility.DATE_FORMAT_REVERSE) < 0) {
            return false;
        } else {
            return true;
        }
    }

    recalulateDefinition() {

        this.changeLockedStatus(true);

        this.refsetService.recalulateDefinition(this.refsetData.id).subscribe();

        UiUtility.manageMemberNotifications(this.refsetId, this.refsetId, "changed", this.processChangedMemberEffects, this.notificationService, this.refsetService, this.router);
    }

    deleteDevelopmentVersion() {

        this.toggleLoadingSpinner(true);

        this.refsetService.deleteDevelopmentVersion(this.refsetData.id).subscribe({
            next: (results) => {

                this.notificationService.show('The "In Development" version of reference set "' + this.refsetData.name + '" (' + this.refsetData.refsetId + ') has been deleted. This can not be undone.', null, 'success', {
                    timeOut: 0,
                    extendedTimeOut: 0
                });

                let link = '/organization/' + this.refsetData.project.organizationId + '/edition/' + this.refsetData.editionId + '/projects/' + this.refsetData.projectId + '/refsets';
                this.router.navigate([link]);
            },
            error: (error) => {
                this.toggleLoadingSpinner(false);
            }
        });
    }

    loadNewRefsetVersion(refsetId: string, versionDate: string) {

        this.refsetId = refsetId;
        this.versionDate = versionDate;

        this.changeLockedStatus(false);
        this.location.replaceState('/details/' + refsetId + '/' + versionDate);
        this.initializeDetailsPage();
    }

    getMemberCount() {

        this.refsetData.memberCount = 'Loading...';

        this.refsetService.getRefsetMemberCount(this.id).subscribe((results) => {
            this.refsetData.memberCount = results;
            // clone refset data here so button components can pick up the change
            this.refsetData = Object.assign({}, this.refsetData);
        });
    }

    loadWorkflowHistoryData(showLoading = false): void {
        if (showLoading) {
            this.toggleLoadingSpinner(true);
        }
        this.refsetService.getWorkflowHistory(this.id, '?sort=modified&sortAscending=false').subscribe((results) => {

            this.workflowHistoryDataSource = new MatTableDataSource(results?.items);
            this.workflowHistoryDataSource.sort = this.sort;
            this.workflowHistoryNotes = null;

            const source = this.workflowHistoryDataSource?.data[0];
            if (source?.workflowStatus === 'IN_REVIEW' && source?.notes) {
                this.reviewNotesAdded = true;
            }
            if (showLoading) {
                this.toggleLoadingSpinner(false);
            }
        });
    }

    addRemoveConcept(params: any): void {

        this.isConceptBeingAdded = new Boolean(params.addConcept) as boolean;

        // if this is coming from the parents section than the concept has children
        if (params.isParentConcept) {
            params.concept.hasChildren = true;
        }

        this.conceptForAddRemove = params.concept;
        this.addRemoveDefinitionExceptionType = params.definitionExceptionType;
    }

    changeLockedStatus(lock: boolean) {

        this.isLocked = lock;
        this.toggleLoadingSpinner(false);
        UiUtility.toggleLockedSections(lock);
        console.timeEnd('reference set detail changeLockedStatus');
    }

    processChangedMemberEffects = (conceptStatusArray?: any) => {

        this.changeLockedStatus(false);
        this.taxonomyManualStateRefresh = new Boolean('true');

        if (this.refsetData.type == Constants.INTENSIONAL) {
            this.initializeDetailsPage();

        } else {
            this.reloadMembersGridAndTaxonomy();
        }

    }

    reloadMembersGridAndTaxonomy() {

        // reload the members grid
        //this.loadTaxonomy();
        this.getMemberCount();
        if (CodeUtility.hasValue(this.originalGridParams)) {
            this.onMembersGridReady(this.originalGridParams);
        }
        this.onTaxonomySearchGridReady(this.taxonomyGridParams);
        this.memberCacheLoaded = new Subject<boolean>();

        const allObservables = {
            memberCacheLoaded: this.memberCacheLoaded
        };

        // call forkJoin on returned observables
        forkJoin(allObservables).subscribe(({ memberCacheLoaded }) => {

            this.reloadTaxonomyTree();

            if (this.conceptDetail != null) {
                this.loadConceptDetail(this.conceptDetail);
            }
        });

        // reload the members taxonomy tree
        this.cacheTaxonomyAncestors();
        this.changeDetectorRef.detectChanges();
    }

    openEclBuilder(fieldId) {
        UiUtility.openEclBuilder(fieldId, this.refsetBranchPath);
    }

    shortenNoteFields() {
        if (CodeUtility.hasValue(this.refsetData)) {
            if (CodeUtility.hasValue(this.refsetData.narrative)) {
                this.refsetData.narrativeShortText = this.refsetData.narrative;
            }

            if (CodeUtility.hasValue(this.refsetData.versionNotes)) {
                this.refsetData.versionNotesShortText = this.refsetData.versionNotes;
            }
        }
    }

    getMemberRow(memberId: string) {

        let concept;

        for (let i = 0; i < this.membersGridData.length; i++) {

            if (this.membersGridData[i].code == memberId) {

                concept = this.membersGridData[i];
                break;
            }
        }

        return concept;
    }

    loadConceptDetail(concept) {

        this.selectedConcept = concept;
        this.conceptDetail = null;
        this.isConceptDetailsLoading = true;
        this.refsetService.getMembersDetails(concept?.code, { refsetInternalId: this.refsetData.id, }).subscribe({
            next: (results) => {

                this.isConceptDetailsLoading = false;
                this.conceptDetail = results;
                this.conceptDetail.roleGroups = results.roleGroups;
                this.conceptDetail.numRoleGroups = Object.keys(this.conceptDetail.roleGroups).length;

                this.conceptDescriptions = results.descriptions.filter(
                    function (description) {
                        return description != null;
                    }
                );

                RefsetUtility.sortDescriptions(this.conceptDescriptions, this.refsetData.edition.fullyQualifiedLanguageRefsets);
            },
            error: (error) => {

                this.isConceptDetailsLoading = false;
                this.toggleLoadingSpinner(false);
            }
        });

        this.loadConceptDetailParents(concept);
    }

    loadConceptDetailParents(concept, language = this.getTaxonomyLanguageWithoutType()) {
        this.conceptDetailParents = [];

        if (!concept?.active) {
            return;
        }

        const restParams = {
            displayType: 'taxonomy',
            returnChildren: false,
            language: language,
            depth: 1,
            startingConceptId: concept.code,
            offset: 0,
            limit: 1000,
        };

        // load the parents
        this.refsetService.getConceptList(this.refsetData.id, restParams).subscribe((results) => {
            this.conceptDetailParents = results.items;
        });
    }

    toggleLoadingSpinner = (showSpinner = true) => {
        this.showLoadingSpinner = showSpinner;
    }

    closeConceptDetails() {

        this.conceptDetail = null;
        this.selectedConcept = null;
    }

    changeVersion() {
        this.router.navigate(['/details', this.refsetId, this.selectedVersion]).then((page) => {
            window.location.reload();
        });
    }

    openChangeRefsetStatus() {

        this.modalService.open(this.changeRefsetStatusDialog, {
            windowClass: 'ready-for-publication-modal',
            backdrop: 'static',
            keyboard: false
        });
    }

    changeRefsetStatus = () => {

        this.toggleLoadingSpinner(true);

        this.refsetService.changeRefsetStatus(this.refsetData.id, !this.refsetData.active).subscribe({
            next: (results) => {

                this.notificationService.show('The Reference Set has been ' + results.status + '.', null, 'success');
                this.loadRefset();
            },
            error: (error) => {
                this.toggleLoadingSpinner(false);
            }
        });

        this.modalService.dismissAll();
    }

    openConvertRefset() {
        const dialogData = {
            headerText: `Make Extensional`,
            template: this.convertRefsetDialog,
            data: this.refsetData,
        };

        this.dialog = this.dialogFactoryService.open(dialogData);

        this.dialog.confirmed().subscribe(result => {
            if (result) {
                this.refsetService.convertRefsetToExtensional(this.id).subscribe(
                    (status) => {

                        if (status.status == 'convert') {

                            this.notificationService.show('The Reference Set has been converted to extensional.', null, 'success', {
                                timeOut: 0,
                                extendedTimeOut: 0
                            });

                            this.processChangedMemberEffects(null);
                            this.loadRefset();
                            return;
                        } else if (status.error) {
                            this.notificationService.show('There was a problem with the conversion, please try again! Error: ' + status.error, null, 'error', {
                                timeOut: 0,
                                extendedTimeOut: 0
                            });
                            return;
                        }
                    },
                    (error) => { }
                );
            }
        });
    }

    onChangeMembersListMode() {
        if (this.selectedMembersListMode == 'table') {
            this.membersTableDisplay = 'inline-block';
            this.membersTaxonomyDisplay = 'none';
        } else {
            this.membersTableDisplay = 'none';
            this.membersTaxonomyDisplay = 'inline-block';
            this.changeTaxonomyLanguage();
        }
    }

    openMemberHistory(conceptId) {
        const concept = this.getMemberRow(conceptId);
        this.refsetService
            .getMemberHistory(this.refsetData?.id, conceptId, null)
            .subscribe((results) => {
                const historyData: any = {};
                historyData.name = `${concept?.name} (${concept?.code})`;

                historyData.columnDefs = [
                    {
                        field: 'version',
                        headerName: 'Version',
                        cellClass: '',
                        tooltipField: 'version',
                    },
                    {
                        field: 'change',
                        headerName: 'Change',
                        cellClass: '',
                        tooltipField: 'change',
                    },
                ];

                historyData.gridOptions = {
                    pagination: false,
                    suppressColumnVirtualisation: true, // need this so you can access rows and cells that might not be currently visible, including if the grid is hidden
                    loadingCellRenderer: 'agLoadingOverlay',
                    rowModelType: 'clientSide',
                    rowData: results.items,
                    rowSelection: 'single',
                    defaultColDef: {
                        sortable: false,
                        filter: false,
                        floatingFilter: false,
                        suppressMenu: true,
                    },
                    enableBrowserTooltips: true,
                };

                const dialogData = {
                    headerText: `History By Reference Set Member`,
                    showCancel: false,
                    showConfirm: false,
                    template: this.memberHistoryDialog,
                    data: historyData,
                };

                this.dialog = this.dialogFactoryService.open(dialogData);
            });
    }

    openInNewWindow(conceptId: string): void {
        const snomedBrowserUrl =
            environment['snomedBrowserUrl'] +
            '&conceptId1=' +
            conceptId +
            '&edition=' +
            this.refsetBranchPath;
        window.open(snomedBrowserUrl);
    }

    clearSearch(field) {
        let value;

        if (field == 'table') {
            value = 'tableSearchInput';
        } else {
            value = 'taxonomySearchInput';
        }

        if (this[value] != '') {
            this[value] = '';
            this['on' + CodeUtility.toTitleCase(field) + 'SearchChange']();
        }
    }

    getRoleString(): string {

        if (!this.refsetData) {
            return '';
        }

        return UiUtility.getRoleString(this.refsetData.roles);
    }

    addSpaceAfterVersionDate(stringValue: string): string {
        if (stringValue?.includes('(')) {
            return stringValue.split('(').join(' (');
        }

        return stringValue;
    }

    capitalizeFirstLetterOfString(stringValue: string): string {
        if (stringValue) {
            return stringValue.replace(/(?:^|\s|[-"'([{])+\S/g, (c) =>
                c.toUpperCase()
            );
        }

        return stringValue;
    }

    toTitleCase(str) {
        return str?.replace(
            /\w\S*/g,
            function (txt) {
                return txt.charAt(0).toUpperCase() + txt.substr(1).toLowerCase();
            }
        );
    }

    modifyStatusSyntax(value: string): string {
        return this.capitalizeFirstLetterOfString(value?.replace(/_/g, ' ').toLowerCase());
    }

    setTimeFormat(dateTime: string): string {
        return new Date(dateTime).toLocaleDateString() + ' ' + new Date(dateTime).toLocaleTimeString();
    }

    getFsn(descriptions: any): string {
        for (const description of descriptions) {
            if (description.languageName.toLowerCase().indexOf('fsn') > 0) {
                return description.term;
            }
        }
    }

    showMembersSearchBar(): boolean {
        return (
            (this.showTable &&
                this.membersTableDisplay === 'inline-block' &&
                this.membersTaxonomyDisplay === 'none') ||
            (this.showTaxonomySearchTable &&
                this.membersTaxonomyDisplay === 'inline-block' &&
                this.membersTableDisplay === 'none')
        );
    }

    setFullNarrativeText(show: boolean): void {
        this.showFullNarrativeText = show;
    }

    setFullNotesText(show: boolean): void {
        this.showFullNotesText = show;
    }

    removeHtmlTags(value: string): string {
        return value?.replace(/(<([^>]+)>)/gi, '');
    }

    metadataCollapseTrigger(): void {
        if (this.hideMetadataTable) {
            this.hideMetadataTable = false;
        } else {
            this.hideMetadataTable = true;
        }
    }

    workflowCollapseTrigger(): void {
        if (this.hideWorkflowTable) {
            this.hideWorkflowTable = false;
        } else {
            this.hideWorkflowTable = true;
        }
    }

    setDescriptions(refsetData: any): Array<string> {
        return refsetData?.descriptions;
    }

    openUndoEditModal(undoEditDialog: NgbModal) {
        this.modalService.open(undoEditDialog, {
            windowClass: 'alert-modal'
        });
    }

    openFeedbackModal(dialog: NgbModal) {
        this.modalService.open(dialog, {
            modalDialogClass: 'full-modal',
            centered: true
        });
    }

    openCancelUpgrade(dialog: NgbModal) {
        this.modalService.open(dialog, {
            modalDialogClass: 'alert-modal',
            centered: true
        });
    }

    openDeleteDevelopmentVersion(dialog: NgbModal) {
        this.modalService.open(dialog, {
            modalDialogClass: 'alert-modal',
            centered: true
        });
    }

    showFlagIcon(showFlag: boolean) {
        this.showFlag = showFlag;
    }

    latestDate(versionList: any[]): string {
        if (this.refsetData?.versionStatus === Constants.IN_DEVELOPMENT) {
            return 'Latest';
        }
        return versionList && versionList[0] ? `${versionList[0].date}` : '';
    }

    snomedBrowserLink() {
        if (environment.production) {
            window.open('http://browser.ihtsdotools.org/');
        } else {
            window.open('http://dailybuild.ihtsdotools.org/');
        }
    }

    downloadMembersTable() {

        this.membersGridApi.exportDataAsCsv({
            columnKeys: this.membersColumnDefs.filter((value) => {

                if (this.user.userName == this.authenticationService.GUEST_USER) {
                    return value.colId == 'code' || value.colId == 'modified';
                } else {
                    return value.colId !== 'actions' && value.colId !== 'active';
                }
            }).map(value => value.colId),
            fileName: `Refset_${this.refsetId}_Members-Table_${CodeUtility.getReverseDate()}.csv`,
            suppressQuotes: true,
            processCellCallback: function (params) {
                return '"' + params.value + '"';
            }
        });
    }

    unfocus(target: any, obj: any): void {
        target.focus();
    }

    notesEditable(index: number, data: any): boolean {
        return index === 0 && data.workflowStatus === this.refsetData.workflowStatus && (this.allowedToEdit || this.allowedToReview);
    }
}
