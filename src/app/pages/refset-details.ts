import {
    ChangeDetectorRef,
    Component,
    TemplateRef,
    ViewChild,
} from "@angular/core";
import { Router, ActivatedRoute, ParamMap } from "@angular/router";
import { DialogService } from "src/app/dialog/services/dialog.service";
import { DialogFactoryService } from "src/app/dialog/services/dialog-factory.service";
import { TemplateRenderer } from "src/app/components/cellRenderers/template.renderer";
import { RefsetService } from "src/app/services/rest/refset.service";
import { Title } from "@angular/platform-browser";
import { CodeUtility } from "src/app/utilities/code.utility";
import { Debounce } from "src/app/decorators/debounce.decorator";
import { UiUtility } from "src/app/utilities/ui.utility";
import { BreadcrumbService } from "src/app/services/breadcrumb.service";
import { PaginationComponent } from "src/app/components/pagination/pagination.component";
import { TreeOptions } from "src/app/models/tree-options.model";
import { RefsetUtility } from "src/app/utilities/refset.utility";
import { Subject, forkJoin } from "rxjs";
import { TaxonomyTreeComponent } from "src/app/components/taxonomy-tree/taxonomy-tree.component";
import { environment } from "src/environments/environment";
import { WorkflowService } from "../services/workflow/workflow.service";
import { MatTableDataSource } from "@angular/material/table";
import { MatSort } from "@angular/material/sort";
import { MatPaginator } from "@angular/material/paginator";
import { Refset } from "../models/refset";
import { NgbModal } from '@ng-bootstrap/ng-bootstrap';
import { catchError } from 'rxjs/operators';

/**
 * @title Tree with nested nodes
 */
@Component({
    selector: "app-refset-details",
    templateUrl: "refset-details.html",
})

export class RefsetDetails {

    id: string;
    refsetId = "";
    isIntensional: boolean = false;
    refsetLoaded = new Subject<boolean>();
    refsetLoaded$ = this.refsetLoaded.asObservable();
    memberCacheLoaded = new Subject<boolean>();
    memberCacheLoaded$ = this.memberCacheLoaded.asObservable();
    tableSearchInput: string;
    versionOptions: any;
    selectedVersion: string;
    languageOptions = [
        {
            value:
                RefsetUtility.DEFAULT_ACCEPT_LANGUAGE +
                ":" +
                RefsetUtility.DEFAULT_LANGUAGE_TYPE,
            display:
                RefsetUtility.DEFAULT_LANGUAGE_CODE +
                " (" +
                RefsetUtility.DEFAULT_LANGUAGE_TYPE +
                ")",
        },
    ];
    selectedTaxonomyLanguage: string =
        RefsetUtility.DEFAULT_ACCEPT_LANGUAGE +
        ":" +
        RefsetUtility.DEFAULT_LANGUAGE_TYPE;
    selectedTaxonomyLanguageIndex = 0;
    membersGridChooserManualStateRefresh = new Boolean(true);
    useDialog = false;
    selectedMembersListMode = "table"; //taxonomy
    membersTableDisplay = "inline-block";
    membersTaxonomyDisplay = "none";
    membersGridApi: any;
    membersGridColumnApi: any;
    membersColumnDefs = [];
    membersGridOptions: any;
    membersGridPaging = {
        pageSize: 10,
        pageSizeOptions: [10, 25, 50, 100],
        totalKnown: false,
        totalRows: null,
        manualStateRefresh: new Boolean(true),
    };
    membersGridLastFilter = "";
    membersGridLastSort = "";
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
    taxonomyManualStateRefresh: Boolean = new Boolean(false);
    taxonomyOptions: TreeOptions = {
        onSelect: this.onTaxonomySelected.bind(this),
        useFsn: false,
        language: RefsetUtility.DEFAULT_ACCEPT_LANGUAGE,
    };
    taxonomyButtonLabel = "Loading...";
    taxonomySearchInput: string;
    taxonomySearchResults: any[] = [];
    showTaxonomySearchTable = false;
    taxonomySearchDisplay = "none";
    taxonomySearchGridApi: any;
    taxonomySearchGridColumnApi: any;
    taxonomySearchColumnDefs = [];
    taxonomySearchGridOptions: any;
    taxonomySearchGridPaging = {
        pageSize: 10,
        pageSizeOptions: [10, 25, 50, 100],
        totalKnown: false,
        totalRows: null,
        manualStateRefresh: new Boolean(true),
    };
    taxonomySearchGridLastFilter = "";
    taxonomySearchGridLastSort = "";
    originalGridParams: any;
    membersGridNumberOfResults: number;
    taxonomySearchNumberOfResults: number;
    showFullNarrativeText = false;
    showFullNotesText = false;
    editMode = false;
    taxonomyGridParams: any;
    showLoadingSpinner = false;
    selectedConcept: any;
    editMetadataProperties: any;
    directUrl: string;
    directRoute: string;
    numOfChildren = undefined;
    hideMetadataTable = false;
    hideWorkflowTable = true;
    workflowHistoryGridOptions: any;
    workflowHistoryColumnDefs: any;
    refsetStatus: string;
    updateToggled = false;
    adminToggled = false;
    workflowHistoryDataSource: MatTableDataSource<any>;
    displayedColumns: string[] = ['modified', 'userName', 'workflowStatus', 'notes'];
    isConceptBeingAdded: Boolean;
    isAddRemoveInDetailsPanel: Boolean;
    addRemoveDefinitionExceptionType: string;
    conceptForAddRemove: any;
    reviewNotesAdded = false;
    allowedToEdit = false;
    allowedToReview = false;

    @ViewChild("detailsActionSection") actionSection: TemplateRef<any>;
    @ViewChild("detailsRichTextDialog") richTextDialog: TemplateRef<any>;
    @ViewChild("detailsMembersPaging") membersPaginationComponent: PaginationComponent;
    @ViewChild("refsetFeedbackDialog") refsetFeedbackDialog: TemplateRef<any>;
    @ViewChild("cloneRefsetDialog") cloneRefsetDialog: TemplateRef<any>;
    @ViewChild("deleteRefsetDialog") deleteRefsetDialog: TemplateRef<any>;
    @ViewChild("compareRefsetDialog") compareRefsetDialog: TemplateRef<any>;
    @ViewChild("refsetVersionNotes") refsetVersionNotes: TemplateRef<any>;
    @ViewChild("refsetAuditDialog") refsetAuditDialog: TemplateRef<any>;
    @ViewChild("refsetArtifactsDialog") refsetArtifactsDialog: TemplateRef<any>;
    @ViewChild("memberHistoryDialog") memberHistoryDialog: TemplateRef<any>;
    @ViewChild("memberFeedbackDialog") memberFeedbackDialog: TemplateRef<any>;
    @ViewChild("detailsMembersTaxonomy") taxonomyMembersComponent: TaxonomyTreeComponent;
    @ViewChild("taxonomySearchPaginationComponent") taxonomySearchPaginationComponent: PaginationComponent;
    @ViewChild("taxonomyResultSection") taxonomyResultSection: TemplateRef<any>;
    @ViewChild("taxonomyPathSection") taxonomyPathSection: TemplateRef<any>;
    @ViewChild("conceptCodeSection") conceptCodeSection: TemplateRef<any>;
    @ViewChild("importFromListDialog") importFromListDialog: TemplateRef<any>;
    @ViewChild(MatPaginator) paginator: MatPaginator;
    @ViewChild(MatSort) sort: MatSort;
    eclString: any;

    constructor(
        private route: ActivatedRoute,
        private router: Router,
        private titleService: Title,
        private dialogFactoryService: DialogFactoryService,
        private refsetService: RefsetService,
        private changeDetectorRef: ChangeDetectorRef,
        private breadcrumbService: BreadcrumbService,
        private readonly workflowService: WorkflowService,
        private readonly modalService: NgbModal
    ) {
        refsetService.getTaxonomyRoot();
    }

    //***** Framework Functions *****/
    ngOnInit() { 

        this.route.data.subscribe((data) => {
            this.refsetService.editMode = this.editMode = data.editMode;
        });

        this.route.params.subscribe(routeParams => {

            this.id = routeParams.refsetId;
            this.initializeDetailsPage();
        });
    }

    initializeDetailsPage() {

        this.refsetLoaded = new Subject<boolean>();
        this.refsetLoaded$ = this.refsetLoaded.asObservable();
        this.memberCacheLoaded = new Subject<boolean>();
        this.memberCacheLoaded$ = this.memberCacheLoaded.asObservable();
        this.showLoadingSpinner = true;
        //this.id = this.route.snapshot.paramMap.get("refsetId");
        this.directUrl = (window.location.host + this.router.url).replace(
            "edit/refset",
            "details"
        );
        this.directRoute = this.router.url.replace("edit/refset", "details");
        if (!this.editMode) {
            this.breadcrumbService.setBreadcrumbs([
                { path: "/directory", label: "Directory" },
                { label: "Refset Details" },
            ]);
        } else {
            this.breadcrumbService.setBreadcrumbs([
                { path: "/projects", label: "Projects" },
                { label: "Edit Reference Set" },
            ]);
        }

        var allObservables = {
            refsetLoaded: this.refsetLoaded$,
            memberCacheLoaded: this.memberCacheLoaded
        };

        this.refsetLoaded$.subscribe((loaded) => {
            this.membersGridOptions = {
                context: { componentParent: this },
                pagination: true,
                suppressColumnVirtualisation: true, // need this so you can access rows and cells that might not be currently visible, including if the grid is hidden
                suppressPaginationPanel: true,
                paginationPageSize: this.membersGridPaging.pageSize,
                cacheBlockSize: this.membersGridPaging.pageSize,
                maxBlocksInCache: 1,
                rowModelType: "infinite",
                rowSelection: "single",
                enableCellTextSelection: true,
                onCellClicked: this.onMembersGridCellClick,
                onGridReady: this.onMembersGridReady,
                onNewColumnsLoaded: this.onMembersColumnsLoaded.bind(this),
                frameworkComponents: {
                    templateRenderer: TemplateRenderer,
                },
                defaultColDef: {
                    sortable: false,
                    resizable: true,
                    suppressMenu: true,
                },
                enableBrowserTooltips: true,
                rowClassRules: {
                    refset_tool_grid_inactive_row: function (params) {
                        var inactivatedRow = false;

                        if (params.data) {
                            inactivatedRow = params.data.active == false;
                        }

                        return inactivatedRow;
                    },
                },
            };

            this.showTable = true;

            // If the member grid data is present manually reload the grid or it won't update
            if (CodeUtility.hasValue(this.membersGridData)) {
                this.onMembersGridReady(this.originalGridParams);
            }

            // If concept details is loaded manually reload it
            if (CodeUtility.hasValue(this.conceptDetail)) {
                this.loadConceptDetail(this.conceptDetail);
            }
        });

        // call forkJoin on returned observables
        forkJoin(allObservables).subscribe(({ refsetLoaded, memberCacheLoaded }) => {
            console.log("refsetLoaded: " + refsetLoaded);
            console.log('memberCacheLoaded: ' + memberCacheLoaded);

            this.loadTaxonomyRoot();

            this.taxonomySearchColumnDefs = [
                {
                    field: "name",
                    colId: "result",
                    headerName: "Result",
                    minWidth: 120,
                    flex: 1,
                    cellClass: "refset-tool-taxonomy-search-column-name",
                    valueGetter: this.taxonomyResultValueGetter.bind(this),
                    cellRenderer: "templateRenderer",
                    cellRendererParams: {
                        template: this.taxonomyResultSection,
                    },
                    tooltipField: "name",
                },
                {
                    field: "parents",
                    colId: "path",
                    headerName: "Path",
                    minWidth: 200,
                    //width: 600,
                    flex: 6,
                    cellClass: "refset-tool-taxonomy-search-column-path",
                    valueGetter: this.taxonomyPathValueGetter.bind(this),
                    cellRenderer: "templateRenderer",
                    cellRendererParams: { template: this.taxonomyPathSection },
                    tooltipField: "parents",
                },
            ];

            this.taxonomySearchGridOptions = {
                context: { componentParent: this },
                pagination: true,
                suppressColumnVirtualisation: true, // need this so you can access rows and cells that might not be currently visible, including if the grid is hidden
                suppressPaginationPanel: true,
                paginationPageSize: this.taxonomySearchGridPaging.pageSize,
                cacheBlockSize: this.taxonomySearchGridPaging.pageSize,
                maxBlocksInCache: 1,
                rowModelType: "infinite",
                rowSelection: "single",
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
                        var inactivatedRow = false;

                        if (params.data) {
                            inactivatedRow = params.data.active == false;
                        }

                        return inactivatedRow;
                    },
                },
            };
            
            this.showLoadingSpinner = false;
        });

        this.refsetService.getRefset(this.id).subscribe((results) => {

            console.log(results);
            this.setButtonGroupToggles(results);
            this.refsetId = results?.refsetId;
            this.isIntensional = results?.type == RefsetUtility.INTENSIONAL;
            this.refsetData = results;
            this.refsetService.setRefsetInformation(this.refsetData);
            this.allowedToEdit = false;
            this.allowedToReview = false;

            if (this.editMode) {

                if (this.refsetData?.availableActions?.includes('FINISH_EDIT')) {
                    this.allowedToEdit = true;

                } else if (this.refsetData?.availableActions?.includes('ACCEPT_REVIEW')) {
                    this.allowedToReview = true;
                }

                this.editMetadataProperties = {
                    project: this.refsetData.project,
                    metadataConcept: this.refsetData.name,
                    parentConcept: this.refsetData.parentConceptId,
                    narrative: this.refsetData.narrative,
                    tags: this.refsetData.tags,
                    referenceType: this.refsetData.type,
                    privateRefset: this.refsetData.privateRefset,
                    versionDate: this.refsetData.versionDate,
                    versionNotes: this.refsetData.versionNotes
                };

                if (this.refsetData.type == RefsetUtility.INTENSIONAL) {
                    this.editMetadataProperties.definitionClauses = this.refsetData.definitionClauses;
                }
            }

            this.refsetData.status = RefsetUtility.getStatus(
                this.refsetData.active
            );
            this.titleService.setTitle(
                "Refset Tool - Refset Details: " + this.refsetId
            );
            let languages =
                this.refsetData?.edition?.fullyQualifiedLanguageRefsets;
            let languageRefsetOptions = [];
            this.refsetData.versionDate = CodeUtility.formatJsonDate(
                this.refsetData?.versionDate,
                CodeUtility.DATE_FORMAT_REVERSE
            );
            this.versionOptions = RefsetUtility.getVersionOptions(
                this.refsetData
            );
            this.selectedVersion = this.id;
            this.refsetData.flagIcon = RefsetUtility.getEditionFlagIcon(
                this.refsetData.edition.branch
            );

            for (let language of languages) {
                let type = "PT";

                if (language.qualifiedLanguageCode.indexOf("FSN") >= 0) {
                    type = "FSN";
                }

                let languageValue =
                    language.languageCode +
                    "-X-" +
                    language.languageRefset +
                    ":" +
                    type;

                if (CodeUtility.testBoolean(language.default)) {
                    this.selectedTaxonomyLanguage = languageValue;
                }

                languageRefsetOptions.push({
                    value: languageValue,
                    display: language.qualifiedLanguageCode,
                });
            }

            if (languageRefsetOptions.length > 0) {
                this.languageOptions = languageRefsetOptions;
            }

            if (CodeUtility.hasValue(this.refsetData)) {
                this.shortenNoteFields();
            } else {
                console.log("Error loading refset details data.");
            }

            this.refsetLoaded.next(true);
            this.refsetLoaded.complete();
        });
        
        this.cacheTaxonomyAncestors();

        this.loadWorkflowHistoryData();
    }

    private setButtonGroupToggles(results: any): void {
        this.refsetStatus = results?.workflowStatus;
    }

    setWorkflowStatusByAction(notes: string, action: string): void {

        this.toggleLoadingSpinner(true);
    
        this.workflowService
            .setWorkflowStatusByAction(
                this.refsetData.id,
                this.refsetData.modifiedBy,
                action,
                notes
            )
            .subscribe((results) => {
                
                if (results) {
                    
                    if (action.includes('UNASSIGN')) {
                        this.router.navigateByUrl('projects');
                    } else if (this.refsetData.id != results.id) {
						this.router.navigateByUrl('edit/refset/' + results.id);
                    } else {
                        this.initializeDetailsPage();
                    }
                } else {

                    this.initializeDetailsPage();
                    this.changeDetectorRef.detectChanges();
                }
            }); 
    }

    loadWorkflowHistoryData(): void {
        this.refsetService
            .getWorkflowHistory(this.id, "?limit=500&offset=0&sort=modified")
            .subscribe((results) => {
                this.workflowHistoryDataSource = results?.items;
                this.workflowHistoryDataSource.sort = this.sort;
                this.checkReviewNotesStatus(this.workflowHistoryDataSource);
            });
    };

    checkReviewNotesStatus(workflowHistoryDataSource: any): void {
        workflowHistoryDataSource?.forEach((source) => {
            if (source?.workflowStatus === 'IN_REVIEW' && source?.notes?.length) {
                this.reviewNotesAdded = true;
            }
        });
    }
    //***** Members Taxonomy Functions  *****/
    cacheTaxonomyAncestors() {

        this.refsetService.cacheMemberAncestors(this.id).subscribe(results => {

            let success = results?.success;

            if (CodeUtility.testBoolean(success)) {

            } else {
                console.log('Error caching refset member details.');
            }

            this.memberCacheLoaded.next(true);
            this.memberCacheLoaded.complete();
        });
    }

    loadTaxonomyRoot() {
        
        let restParams = {
            displayType: "taxonomy",
            returnStartingConcept: true,
            language: this.getTaxonomyLanguageWithoutType(),
            depth: 1,
            startingConceptId: RefsetUtility.SNOMED_ROOT_CONCEPT_ID,
            offset: 0,
            limit: 1000,
        };

        // load taxonomy root
        this.refsetService
            .getConceptList(this.refsetData.id, restParams)
            .subscribe((results) => {
                this.membersTaxonomyRoot = results.items[0];
                this.taxonomyButtonLabel = "Taxonomy";
                this.showTaxonomySearchTable = true;
                this.showLoadingSpinner = false;
            });
    }

    onTaxonomySelected(event) {
        let selectedConcept = CodeUtility.clone(event.node.data);
        // this.loadConceptDetail(selectedConcept);
    }

    changeTaxonomyLanguage() {
        this.selectedTaxonomyLanguageIndex = this.languageOptions.findIndex(
            (option) => option.value === this.selectedTaxonomyLanguage
        );
        this.taxonomySearchGridApi.refreshCells();
        this.taxonomyOptions.useFsn =
            this.getTaxonomyLanguageType().toLowerCase() == "fsn";
        this.taxonomyOptions.language = this.getTaxonomyLanguageWithoutType();

        // reload the members taxonomy tree
        this.reloadTaxonomyTree();

        // if concept details is present reload the concept details child tree
        if (CodeUtility.hasValue(this.conceptDetail)) {
            delete this.conceptDetail.children;
            this.conceptDetail = CodeUtility.clone(this.conceptDetail);
            this.loadConceptDetailParents(this.conceptDetail.code);
        }
    }

    getTaxonomyLanguageWithoutType() {
        return this.selectedTaxonomyLanguage.replace(/:.*$/, "");
    }

    getTaxonomyLanguageType() {
        return this.selectedTaxonomyLanguage.replace(/^.*:/, "");
    }

    onTaxonomySearchGridReady = (gridReadyParams) => {
        this.taxonomySearchGridApi = gridReadyParams.api;
        this.taxonomySearchGridColumnApi = gridReadyParams.columnApi;
        this.taxonomyGridParams = gridReadyParams;

        let dataSource = {
            rowCount: null,
            getRows: (rowParams) => {
                if (!CodeUtility.hasValue(this.taxonomySearchInput)) {
                    this.taxonomySearchGridApi.showNoRowsOverlay();
                    rowParams.successCallback([], 0);
                    return;
                }

                this.taxonomySearchGridApi.showLoadingOverlay();

                let pageNumber =
                    rowParams.endRow /
                    this.taxonomySearchGridApi.paginationGetPageSize();
                let query = "";
                let sort = UiUtility.formatSortData(rowParams.sortModel);

                if (
                    CodeUtility.hasValue(this.taxonomySearchInput) &&
                    this.taxonomySearchInput.length > 2
                ) {
                    query =
                        CodeUtility.addIfNotEmpty(query, " AND ") +
                        this.taxonomySearchInput;
                }

                let newFilterString = query;
                let newSortString = JSON.stringify(sort);

                // if the filters or sort have changed then move to the first page
                if (
                    newFilterString !== this.taxonomySearchGridLastFilter ||
                    newSortString !== this.taxonomySearchGridLastSort
                ) {
                    pageNumber = 1;
                    this.taxonomySearchGridApi.api?.paginationGoToPage(0);
                }

                // if the filters have changed then reset the total row variables
                if (newFilterString !== this.taxonomySearchGridLastFilter) {
                    this.taxonomySearchGridPaging.totalRows = null;
                    this.taxonomySearchGridPaging.totalKnown = false;
                }

                this.taxonomySearchGridLastFilter = newFilterString;
                this.taxonomySearchGridLastSort = newSortString;

                let restParams: any = {
                    sortModel: rowParams.sortModel,
                    limit: this.taxonomySearchGridApi.paginationGetPageSize(),
                    offset: pageNumber - 1,
                };

                if (CodeUtility.hasValue(query)) {
                    restParams.query = query;
                }

                this.refsetService
                    .getTaxonomySearch(this.id, restParams)
                    .subscribe(
                        (results) => {

                            this.taxonomySearchNumberOfResults = results.total;
                            this.taxonomySearchResults = results.items;
                            if (results.items.length == 0 && pageNumber > 1) {
                                this.taxonomySearchGridPaging.totalRows =
                                    this.taxonomySearchGridApi.paginationGetPageSize() *
                                    (pageNumber - 1);
                                this.taxonomySearchGridPaging.totalKnown = true;
                                this.taxonomySearchPaginationComponent.goToPage(
                                    pageNumber - 1
                                );
                                return;
                            }

                            UiUtility.applyServerPagedGridResults(
                                results,
                                this.taxonomySearchGridApi,
                                this.taxonomySearchGridPaging,
                                pageNumber,
                                rowParams
                            );
                        },
                        (error) => {
                            this.taxonomySearchResults = [];
                            this.taxonomySearchGridApi.showNoRowsOverlay();
                            rowParams.successCallback([], 0);
                        }
                    );
            },
        };

        gridReadyParams.api.setDatasource(dataSource);
    };

    taxonomyPathValueGetter = function (params) {
        if (!CodeUtility.hasValue(params.data)) {
            return "";
        }

        let pathString = "";

        for (let pathConcept of params.data.parents) {
            let parentText = this.getTaxonomySearchDescription(pathConcept);
            pathString =
                CodeUtility.addIfNotEmpty(pathString, " > ") + parentText;
        }

        return pathString;
    };

    taxonomyResultValueGetter = function (params) {
        if (!CodeUtility.hasValue(params.data)) {
            return "";
        }

        return this.getTaxonomySearchDescription(params.data);
    };

    getTaxonomySearchDescription(concept) {
        let text = "";
        let choosenDescription =
            concept.descriptions[this.selectedTaxonomyLanguageIndex];

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
        let selectedRows = this.taxonomySearchGridApi.getSelectedRows();
        let selectedId: string;
        let selectedPath: any;

        selectedRows.forEach(function (selectedRow, index) {
            selectedId = selectedRow.code;
            selectedPath = selectedRow.parents;
        });

        this.goToTaxonomyConcept(selectedId, selectedPath);
    };

    @Debounce()
    onTaxonomySearchChange() {
        let showSearch =
            CodeUtility.hasValue(this.taxonomySearchInput) &&
            (this.taxonomySearchResults.length > 0 ||
                this.taxonomySearchInput.length > 2);

        if (showSearch) {
            this.taxonomySearchDisplay = "block";

            if (this.taxonomySearchInput.length > 2) {
                this.taxonomySearchGridApi.purgeInfiniteCache();
            }
        } else {
            this.taxonomySearchDisplay = "none";
        }
    }

    goToTaxonomyConcept(selectedConcept, selectedPath) {
        this.taxonomyMembersComponent.findNodeInTree(
            selectedConcept,
            selectedPath,
            undefined,
            true,
            false
        );
    }

    reloadTaxonomyTree() {

        this.taxonomyManualStateRefresh = new Boolean("true");
        this.loadTaxonomyRoot();
    }

    //***** Members Grid Functions *****/
    onMembersGridReady = (gridReadyParams) => {
        this.originalGridParams = gridReadyParams;
        this.membersGridApi = gridReadyParams.api;
        this.membersGridColumnApi = gridReadyParams.columnApi;
        //let refsetLanguages = [{languageId: 'EN (PT)', languageName: 'EN (PT)'}, {languageId: 'EN (FSN)', languageName: 'EN (FSN)'}];

        let dataSource = {
            rowCount: null,
            getRows: (rowParams) => {
                this.membersGridApi.showLoadingOverlay();

                let pageNumber =
                    rowParams.endRow /
                    this.membersGridApi.paginationGetPageSize();
                let query = UiUtility.formatFilterData(rowParams.filterModel);
                let sort = UiUtility.formatSortData(rowParams.sortModel);

                if (
                    CodeUtility.hasValue(this.tableSearchInput) &&
                    this.tableSearchInput.length > 2
                ) {
                    query =
                        CodeUtility.addIfNotEmpty(query, " AND ") +
                        this.tableSearchInput;
                } else if (
                    this.tableSearchInput &&
                    !CodeUtility.hasValue(this.tableSearchInput)
                ) {
                    this.membersGridApi.showNoRowsOverlay();
                    rowParams.successCallback([], 0);
                    return;
                }

                let newFilterString = query;
                let newSortString = JSON.stringify(sort);

                // if the filters or sort have changed then move to the first page
                if (
                    newFilterString !== this.membersGridLastFilter ||
                    newSortString !== this.membersGridLastSort
                ) {
                    pageNumber = 1;
                    this.membersGridApi?.api?.paginationGoToPage(0);
                }

                // if the filters have changed then reset the total row variables
                if (newFilterString !== this.membersGridLastFilter) {
                    this.membersGridPaging.totalRows = null;
                    this.membersGridPaging.totalKnown = false;
                }

                this.membersGridLastFilter = newFilterString;
                this.membersGridLastSort = newSortString;

                let restParams: any = {
                    sortModel: rowParams.sortModel,
                    limit: this.membersGridApi.paginationGetPageSize(),
                    offset: pageNumber - 1,
                    displayType: "list",
                };

                if (CodeUtility.hasValue(query)) {
                    restParams.query = query;
                }

                // if editing enable the return of hasChildren data in the list
                if (this.editMode) {
                    restParams.editing = true;
                }

                this.refsetService
                    .getConceptList(this.id, restParams)
                    .subscribe(
                        (results) => {

                            this.membersGridNumberOfResults = results.total;
                            if (results.items.length == 0 && pageNumber > 1) {
                                this.membersGridApi.showNoRowsOverlay();
                                this.membersGridPaging.totalRows =
                                    this.membersGridApi.paginationGetPageSize() *
                                    (pageNumber - 1);
                                this.membersGridPaging.totalKnown = true;
                                this.membersPaginationComponent.goToPage(
                                    pageNumber - 1
                                );
                                return;
                            }

                            let data = results.items.filter((item) => {
                                return item.active ? item : undefined;
                            });
                            this.membersGridData = data;

                            if (!data.length) {
                                this.membersGridApi.showNoRowsOverlay();
                                rowParams.successCallback([], 0);
                                return;
                            }

                            this.membersColumnDefs = [
                                {
                                    field: "code",
                                    colId: "code",
                                    headerName: "Concept ID",
                                    minWidth: 120,
                                    width: 140,
                                    cellClass:
                                        "refset-tool-details-column-concept-id",
                                    cellRenderer: "templateRenderer",
                                    cellRendererParams: {
                                        template: this.conceptCodeSection,
                                    },
                                    tooltipField: "code",
                                },
                            ];

                            for (
                                let i = 0;
                                i < this.languageOptions.length;
                                i++
                            ) {
                                let language = this.languageOptions[i];
                                let minWidth =
                                    language.value === "101FSN" ? 250 : 190;
                                this.membersColumnDefs.push({
                                    field: i.toString(),
                                    flex: 1,
                                    minWidth: minWidth,
                                    colId: language.value,
                                    headerName: language.display,
                                    cellClass:
                                        "refset-tool-details-column-description",
                                    valueGetter: this.descriptionValueGetter,
                                    tooltipField: i.toString(),
                                });
                            }

                            this.membersColumnDefs.push(
                                ...[
                                    {
                                        field: "memberEffectiveTime",
                                        colId: "modified",
                                        flex: 1,
                                        minWidth: 150,
                                        headerName: "Modified Date",
                                        cellClass:
                                            "refset-tool-details-column-modified-date",
                                        valueGetter:
                                            UiUtility.gridDateValueGetter,
                                        tooltipField: "memberEffectiveTime",
                                    },
                                    {
                                        field: "active",
                                        colId: "actions",
                                        headerName: "",
                                        width: 120,
                                        minWidth: 120,
                                        cellClass:
                                            "refset-tool-details-column-actions",
                                        cellRenderer: "templateRenderer",
                                        cellRendererParams: {
                                            template: this.actionSection,
                                        },
                                        filter: false,
                                        pinned: "right",
                                        tooltipField: "active",
                                    },
                                ]
                            );

                            if (data.length > 0) {
                                this.membersGridApi.hideOverlay();
                                let currentRowCount = null;
                                let lastRow = -1;

                                if (
                                    results.totalKnown ||
                                    data.length <
                                        this.membersGridApi.paginationGetPageSize() ||
                                    this.membersGridPaging.totalKnown
                                ) {
                                    if (results.totalKnown) {
                                        lastRow = results.total;
                                    } else if (
                                        this.membersGridPaging.totalKnown
                                    ) {
                                        lastRow =
                                            this.membersGridPaging.totalRows;
                                    } else {
                                        currentRowCount =
                                            data.length +
                                            (pageNumber - 1) *
                                                this.membersGridApi.paginationGetPageSize();
                                        lastRow = currentRowCount;
                                    }

                                    this.membersGridPaging.totalRows = lastRow;
                                    this.membersGridPaging.totalKnown = true;
                                } else {
                                    currentRowCount =
                                        data.length +
                                        (pageNumber - 1) *
                                            this.membersGridApi.paginationGetPageSize();
                                }

                                rowParams.successCallback(data, lastRow);
                            } else {
                                this.membersGridApi.showNoRowsOverlay();
                                rowParams.successCallback([], 0);
                            }

                            this.membersGridPaging.manualStateRefresh =
                                new Boolean(true);
                        },
                        (error) => {
                            this.membersGridApi.showNoRowsOverlay();
                            rowParams.successCallback([], 0);
                        }
                    );
            },
        };

        gridReadyParams.api.setDatasource(dataSource);

        // set placeholders on the grid floating filter fields
        Array.from(
            document.querySelectorAll(
                ".ag-floating-filter-full-body .ag-input-field-input"
            )
        ).forEach((obj: any) => {
            if (obj.attributes["disabled"]) {
                // skip columns with disabled filter
                return;
            }

            let label = obj.getAttribute("aria-label");
            let value =
                label.substring(0, label.indexOf("Filter Input")) + "...";
            obj.setAttribute("placeholder", value);
        });
    };

    onMembersColumnsLoaded() {
        this.membersGridChooserManualStateRefresh = new Boolean(true);
    }

    descriptionValueGetter = function (params) {
        return params?.data?.descriptions[params.colDef.field]?.term;
    };

    onMembersGridCellClick = (event) => {
        if (event.column.colId === "actions" || event.column.colId === "code") {
        } else {
            let selectedRows = this.membersGridApi.getSelectedRows();
            let selectedId: string;

            selectedRows.forEach(function (selectedRow, index) {
                selectedId = selectedRow.code;
            });

            let selectedConcept = this.getMemberRow(selectedId);
            this.loadConceptDetail(selectedConcept);

            //this.router.navigate(['/details', selectedId]);
        }
    };

    @Debounce()
    onTableSearchChange() {
        if (
            !CodeUtility.hasValue(this.tableSearchInput) ||
            (CodeUtility.hasValue(this.tableSearchInput) &&
                this.tableSearchInput.length > 2)
        ) {
            this.membersGridApi.purgeInfiniteCache();
        }
    }

    //***** General Functions *****/

    addRemoveConcept(params: any): void {

        this.isConceptBeingAdded = new Boolean(params.addConcept);

        // if this is coming from the parents section than the concept has children
        if (params.isInDetailsPanel) {
            params.concept.hasChildren = true;
        }

        this.conceptForAddRemove = params.concept;
        this.addRemoveDefinitionExceptionType = params.definitionExceptionType;
        this.isAddRemoveInDetailsPanel = params.isInDetailsPanel;
    }

    processChangedMemberEffects = () => {

        this.showLoadingSpinner = true;

        if (this.refsetData.type == RefsetUtility.INTENSIONAL) {
            this.initializeDetailsPage();

        } else {

            if (this.isAddRemoveInDetailsPanel) {

                this.loadConceptDetail(this.selectedConcept);
                this.reloadMembersGridAndTaxonomy();
    
            } else {
    
                this.reloadMembersGridAndTaxonomy();
                this.showLoadingSpinner = false;
            } 
        }
        
    }
    
    reloadMembersGridAndTaxonomy(){

        // reload the members grid
        this.onMembersGridReady(this.originalGridParams)
        this.memberCacheLoaded = new Subject<boolean>();

        var allObservables = {
            memberCacheLoaded: this.memberCacheLoaded
        };

        // call forkJoin on returned observables
        forkJoin(allObservables).subscribe(({ memberCacheLoaded }) => {
            this.reloadTaxonomyTree();
        });

        // reload the members taxonomy tree
        this.cacheTaxonomyAncestors();

        if (this.conceptDetail != null) {
            this.loadConceptDetail(this.conceptDetail);
        }
    }

    // openEclBuilder(fieldId) {
    //     UiUtility.openEclBuilder(
    //         fieldId,
    //         RefsetUtility.getBranchPath(this.refsetData)
    //     );
    // }

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

        this.refsetService
            .getMembersDetails(concept?.code, {
                refsetInternalId: this.refsetData.id,
            })
            .subscribe((results) => {
                this.isConceptDetailsLoading = false;
                this.conceptDetail = results;

                this.conceptDetail.roleGroups = results.roleGroups;
                this.conceptDetail.numRoleGroups = Object.keys(this.conceptDetail.roleGroups).length;

                this.conceptDescriptions = results.descriptions.filter(
                    function (description) {
                        return description != null;
                    }
                );

                RefsetUtility.sortDescriptions(
                    this.conceptDescriptions,
                    this.refsetData.edition.fullyQualifiedLanguageRefsets
                );
            });

        this.loadConceptDetailParents(concept?.code);
    }

    loadConceptDetailParents(conceptId) {
        let restParams = {
            displayType: "taxonomy",
            returnChildren: false,
            language: this.getTaxonomyLanguageWithoutType(),
            depth: 1,
            startingConceptId: conceptId,
            offset: 0,
            limit: 1000,
        };

        // load the parents
        this.refsetService
            .getConceptList(this.refsetData.id, restParams)
            .subscribe((results) => {
                this.conceptDetailParents = results.items;
            });
    }

    toggleLoadingSpinner = (showSpinner: boolean = true) => {
        this.showLoadingSpinner = showSpinner;
    }

    closeConceptDetails() {

        this.conceptDetail = null;
        this.selectedConcept = null;
    }

    onTmcChange($event) {}

    openRichTextEditor(fieldName, displayName = fieldName) {
        const dialogId = "detailsRichTextDialog";

        const dialogData = {
            headerText: `Refset ${displayName} for ${this.refsetData.name} (${this.refsetData.id})`,
            template: this.richTextDialog,
            data: { fieldName: fieldName, text: this.refsetData[fieldName] },
        };

        const dialogOptions = {
            id: dialogId,
            width: "750px",
        };

        this.dialog = this.dialogFactoryService.open(dialogData, dialogOptions);

        this.dialog.confirmed().subscribe((data) => {
            if (data) {
                this.refsetData[fieldName] = data.text;
                this.shortenNoteFields();
            }
        });
    }

    changeVersion() {
        this.router
            .navigate(["/details", this.selectedVersion])
            .then((page) => {
                window.location.reload();
            });
    }

    openAuditTrail() {
        const dialogId = "refsetAuditDialog";

        const dialogData = {
            headerText: `Refset Audit Trail`,
            template: this.refsetAuditDialog,
            data: this.refsetData,
        };

        const dialogOptions = {
            id: dialogId,
        };

        this.dialog = this.dialogFactoryService.open(dialogData);

        this.dialog.confirmed().subscribe((data) => {});
    }

    openArtifacts() {
        const dialogId = "refsetArtifactsDialog";

        const dialogData = {
            headerText: `Refset Artifacts`,
            template: this.refsetArtifactsDialog,
            data: this.refsetData,
        };

        const dialogOptions = {
            id: dialogId,
        };

        this.dialog = this.dialogFactoryService.open(dialogData);

        this.dialog.confirmed().subscribe((data) => {});
    }

    openRefsetFeedback() {
        const dialogId = "refsetFeedbackDialog";

        const dialogData = {
            headerText: `Refset Feedback`,
            template: this.refsetFeedbackDialog,
            data: this.refsetData,
        };

        const dialogOptions = {
            id: dialogId,
        };

        this.dialog = this.dialogFactoryService.open(dialogData);

        this.dialog.confirmed().subscribe((data) => {});
    }

    openCloneRefset() {
        const dialogId = "cloneRefsetDialog";

        const dialogData = {
            headerText: `Clone Refset`,
            template: this.refsetFeedbackDialog,
            data: this.refsetData,
        };

        const dialogOptions = {
            id: dialogId,
        };

        this.dialog = this.dialogFactoryService.open(dialogData);

        this.dialog.confirmed().subscribe((data) => {});
    }

    openDeleteRefset() {
        const dialogId = "deleteRefsetDialog";

        const dialogData = {
            headerText: `Delete Refset`,
            template: this.refsetFeedbackDialog,
            data: this.refsetData,
        };

        const dialogOptions = {
            id: dialogId,
        };

        this.dialog = this.dialogFactoryService.open(dialogData);

        this.dialog.confirmed().subscribe((data) => {});
    }

    openCompareRefset() {
        const dialogId = "compareRefsetDialog";

        const dialogData = {
            headerText: `Compare Refset`,
            template: this.refsetFeedbackDialog,
            data: this.refsetData,
        };

        const dialogOptions = {
            id: dialogId,
        };

        this.dialog = this.dialogFactoryService.open(dialogData);

        this.dialog.confirmed().subscribe((data) => {});
    }

    openRefsetVersionNotes() {
        const dialogId = "refsetVersionNotes";

        const dialogData = {
            headerText: `Version Notes`,
            template: this.refsetVersionNotes,
            data: this.refsetData,
        };

        const dialogOptions = {
            id: dialogId,
        };

        this.dialog = this.dialogFactoryService.open(dialogData);

        this.dialog.confirmed().subscribe((data) => {});
    }

    changeLanguage() {}

    onChangeMembersListMode() {
        if (this.selectedMembersListMode == "table") {
            this.membersTableDisplay = "inline-block";
            this.membersTaxonomyDisplay = "none";
        } else {
            this.membersTableDisplay = "none";
            this.membersTaxonomyDisplay = "inline-block";
        }
    }

    openMemberFeedback(conceptId: string) {
        let concept = this.getMemberRow(conceptId);
        const dialogId = "conceptFeedbackDialog";

        const dialogData = {
            headerText: `Member Feedback for ${concept.name} (${conceptId})`,
            template: this.memberFeedbackDialog,
            data: concept,
        };

        const dialogOptions = {
            id: dialogId,
        };

        this.dialog = this.dialogFactoryService.open(dialogData);

        this.dialog.confirmed().subscribe((data) => {});
    }

    openMemberHistory(conceptId) {
        let concept = this.getMemberRow(conceptId);
        this.refsetService
            .getMemberHistory(this.refsetData?.id, conceptId, null)
            .subscribe((results) => {
                let historyData: any = {};
                historyData.name = `${concept?.name} (${concept?.code})`;

                historyData.columnDefs = [
                    {
                        field: "version",
                        headerName: "Version",
                        cellClass: "refset-tool-member-history-column-version",
                        tooltipField: "version",
                    },
                    {
                        field: "change",
                        headerName: "Change",
                        cellClass: "refset-tool-member-history-column-change",
                        tooltipField: "change",
                    },
                ];

                historyData.gridOptions = {
                    pagination: false,
                    suppressColumnVirtualisation: true, // need this so you can access rows and cells that might not be currently visible, including if the grid is hidden
                    loadingCellRenderer: "agLoadingOverlay",
                    rowModelType: "clientSide",
                    rowData: results.items,
                    rowSelection: "single",
                    defaultColDef: {
                        sortable: false,
                        filter: false,
                        floatingFilter: false,
                        suppressMenu: true,
                    },
                    enableBrowserTooltips: true,
                };

                const dialogId = "memberHistoryDialog";

                const dialogData = {
                    headerText: `History By Reference Set Member`,
                    showCancel: false,
                    template: this.memberHistoryDialog,
                    data: historyData,
                };

                const dialogOptions = {
                    id: dialogId,
                };

                this.dialog = this.dialogFactoryService.open(dialogData);
            });
    }

    openInNewWindow(conceptId: string): void {
        let snomedBrowserUrl =
            environment["snomedBrowserUrl"] +
            "&conceptId1=" +
            conceptId +
            "&edition=" +
            RefsetUtility.getBranchPath(this.refsetData);
        window.open(snomedBrowserUrl);
    }

    clearSearch(field) {
        let value;

        if (field == "table") {
            value = "tableSearchInput";
        } else {
            value = "taxonomySearchInput";
        }

        if (this[value] != "") {
            this[value] = "";
            this["on" + CodeUtility.toTitleCase(field) + "SearchChange"]();
        }
    }

    addSpaceAfterVersionDate(stringValue: string): string {
        if (stringValue?.includes("(")) {
            return stringValue.split("(").join(" (");
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

    modifyStatusSyntax(value: string): string {
        return this.capitalizeFirstLetterOfString(value?.replace(/\_/g, ' ').toLowerCase());
    }

    setTimeFormat(dateTime: string): string {
        return new Date(dateTime).toLocaleDateString() + ' ' + new Date(dateTime).toLocaleTimeString();
    }

	
    getFsn(descriptions: any)  : string{
        for (let description of descriptions) {
        	if (description.languageName.toLowerCase().indexOf("fsn") > 0) {
				return description.term;
			}
		}
    }
	
    showMembersSearchBar(): boolean {
        return (
            (this.showTable &&
                this.membersTableDisplay === "inline-block" &&
                this.membersTaxonomyDisplay === "none") ||
            (this.showTaxonomySearchTable &&
                this.membersTaxonomyDisplay === "inline-block" &&
                this.membersTableDisplay === "none")
        );
    }

    setFullNarrativeText(show: boolean): void {
        this.showFullNarrativeText = show;
    }

    setFullNotesText(show: boolean): void {
        this.showFullNotesText = show;
    }

    removeHtmlTags(value: string): string {
        return value?.replace(/(<([^>]+)>)/gi, "");
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

    // This is here only because the service is static, remember to move back to the utility service after the demo.
    openEclBuilder(fieldId: string, isSearch: boolean = true) {
        let field = $('#' + fieldId);
        let eclString: any = field.val();
        let snowstormApiUrl = environment['snowstormApiUrl'];
        const regex = /^([\ a-zA-Z0-9\ \<\>\!\^]*(\|[^\|]*\|)?)*$/gm;

        if (!regex.test(eclString)) {
            eclString = '';
        }

        $('body').append('<ecl-builder id="ecl-builder" branch=' + RefsetUtility.getBranchPath(this.refsetData) + ' api-url="' + snowstormApiUrl + '" ecl-string="' + eclString + '"></ecl-builder>');

        const eclBuilder = document.querySelector('ecl-builder');

        eclBuilder.addEventListener('output', (event: any) => {

            if (isSearch) {
                field.val(event.detail);

                const customEvent = document.createEvent('Event');
                customEvent.initEvent('input', true, true);

                field[0].dispatchEvent(customEvent);
            } else {
                this.eclString = event.detail;
                this.openImportFromListModal(this.importFromListDialog);
            }
        });
    }

    openImportFromListModal(importFromListDialog: any) {
        this.modalService.open(importFromListDialog, {
            backdrop: "static",
            keyboard: false,
        });
    }

    addMembers(): void {

        if (!this.eclString?.length) {
            return;
        }

        this.showLoadingSpinner = true;

        this.refsetService.addRefsetMembers(this.refsetData?.id, "list", '', escape(this.eclString))
            .pipe(catchError((err) => {

                if (err) {
                    this.showLoadingSpinner = false;
                }

                return err;

            })).subscribe((data) => {

                this.showLoadingSpinner = false;
                this.reloadMembersGridAndTaxonomy();
                this.eclString = "";
                this.modalService.dismissAll();
            });
    }

    removeMembers(): void {

        if (!this.eclString?.length) {
            return;
        }

        this.showLoadingSpinner = true;

        this.refsetService.removeRefsetMembers(this.refsetData?.id, "list", '', escape(this.eclString))
            .pipe(catchError((err) => {

                if (err) {
                    this.showLoadingSpinner = false;
                }

                return err;

            })).subscribe((data) => {
                
                this.showLoadingSpinner = false;
                this.reloadMembersGridAndTaxonomy();
                this.modalService.dismissAll();
                },
                (error) => {
                    this.showLoadingSpinner = false;
                }
            );
    }
}
