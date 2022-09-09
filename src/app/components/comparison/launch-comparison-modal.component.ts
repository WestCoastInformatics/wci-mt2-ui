import { Component, EventEmitter, Input, Output, TemplateRef, ViewChild } from '@angular/core';
import { Router } from '@angular/router';
import { NgbModal, NgbModalRef } from '@ng-bootstrap/ng-bootstrap';
import { RefsetDetails } from 'src/app/pages/refset-details';
import { NotificationService } from 'src/app/services/notification.service';
import { RefsetService } from 'src/app/services/rest/refset.service';
import { CodeUtility } from 'src/app/utilities/code.utility';
import { RefsetUtility } from 'src/app/utilities/refset.utility';
import { UiUtility } from 'src/app/utilities/ui.utility';
import { TemplateRenderer } from 'src/app/components/cellRenderers/template.renderer';
import { PaginationComponent } from 'src/app/components/pagination/pagination.component';
import { Debounce } from 'src/app/decorators/debounce.decorator';
import { TreeOptions } from 'src/app/models/tree-options.model';
import { CategoryFilterComponent } from '../categoryFilter/category-filter.component';
import { environment } from 'src/environments/environment';

@Component({
    selector: 'app-launch-comparison-modal',
    templateUrl: './launch-comparison-modal.component.html'
})
export class LaunchComparisonModalComponent {

    comparisonRefsetInternalId: string;
    activeRefsetVersionOptions: any[];
    comparisonRefsetVersionOptions: any[];
    comparisonTypeSelected: string
    comparisonSearchInput: string
    comparisonRefsetSelect: string
    activeRefsetVersionDate: string;
    refsetOptions: any[];
    refsetOptionsLoading = false;
    openedModel: NgbModalRef;

    gridApi: any;
    gridColumnDefs = [];
    gridOptions: any;
    gridPaging = { pageSize: 10, pageSizeOptions: [10, 25, 50, 100], totalKnown: false, totalRows: null, manualStateRefresh: new Boolean(true) };
    showTable = false;
    activeRefsetName: string;
    comparisonData: any;
    comparisonRefsetVersionDate: string;
    comparisonRefsetName: string;
    comparisonRefsetStatus: string;
    allowedToEdit = false;
    showLoadingSpinner = false;
    isLocked = false;
    conceptForAddRemove: any;
    isConceptBeingAdded: boolean;
    addRemoveDefinitionExceptionType: string;
    changeReportData: any[];

    selectedConcept: any;
    conceptDetail: any;
    isConceptDetailsLoading = false;
    conceptDetailParents: any;
    conceptDetailsOptions: TreeOptions = {
        useFsn: false,
        language: RefsetUtility.DEFAULT_ACCEPT_LANGUAGE,
    };
    taxonomyManualStateRefresh = new Boolean(false);
    taxonomyNumberOfChildren: number;

    @Input() activeRefset: any;
    @Input() isDetailPage: boolean;
    @Input() refsetBranchPath: string;
    @Output() loadingSpinner = new EventEmitter<boolean>(true);
    @Output() changeLockedStatus = new EventEmitter<boolean>(true);

    @ViewChild('comparisonCodeSection') codeSection: TemplateRef<any>;
    @ViewChild('comparisonGridPaging') paginationComponent: PaginationComponent;
    @ViewChild('showComparisonDialog') showComparisonDialog: NgbModal;

    constructor(private readonly modalService: NgbModal,
        readonly refsetService: RefsetService,
        private readonly router: Router,
        private readonly notificationService: NotificationService,
        readonly refsetDetails: RefsetDetails) {
    }

    openLaunchModal(comparisonLaunchDialog: NgbModal) {

        this.activeRefsetVersionOptions = [];
        this.comparisonRefsetVersionOptions = [];
        this.refsetOptions = [];
        this.comparisonRefsetInternalId = null;
        this.comparisonData = null;
        this.selectedConcept = null;
        this.conceptDetail = null;
        this.conceptDetailParents = null;
        this.conceptDetailParents = null;
        this.allowedToEdit = false;
        this.showLoadingSpinner = false;
        this.showTable = false;
        this.isConceptDetailsLoading = false;
        this.taxonomyManualStateRefresh = new Boolean(false);
        this.changeReportData = [];
        this.comparisonSearchInput = '';
        this.comparisonRefsetSelect = '';

        this.activeRefsetVersionDate = CodeUtility.formatJsonDate(this.activeRefset.versionDate, CodeUtility.DATE_FORMAT_REVERSE);
        this.activeRefsetVersionOptions = RefsetUtility.getVersionOptions(this.activeRefset);
        let selectedVersionDateIndex = 0;

        if (this.activeRefset.versionStatus != RefsetUtility.IN_DEVELOPMENT) {
            selectedVersionDateIndex = this.activeRefsetVersionOptions.findIndex((element) => { return element.display.startsWith(this.activeRefsetVersionDate); });
        }

        if (this.activeRefsetVersionOptions.length > 1) {

            this.activeRefsetVersionOptions.splice(selectedVersionDateIndex, 1);
            this.comparisonTypeSelected = 'same_refset';
        } else {

            this.activeRefsetVersionOptions = [];
            this.comparisonTypeSelected = 'different_refset';
        }

        this.openedModel = this.modalService.open(comparisonLaunchDialog, { backdrop: 'static', keyboard: false, windowClass: 'launch-comparison-dialog', size: 'lg' });
    }

    comparisonSelectionChange(event: any): void {

        this.comparisonTypeSelected = event.value;
        this.comparisonRefsetInternalId = null;
        this.comparisonRefsetVersionOptions = [];
        this.comparisonSearchInput = '';
        this.comparisonRefsetSelect = '';
    }

    async onSearchChange(value): Promise<void> {
        await this.search(value);
    }

    handleInput(event: KeyboardEvent): void {
        event.stopPropagation();
    }

    @Debounce()
    search(query: string): void {

        this.refsetOptionsLoading = true;
        this.refsetOptions = [];
        this.comparisonRefsetInternalId = null;
        this.comparisonRefsetVersionOptions = [];

        this.refsetService.searchRefsetsForDropdowns(query).subscribe((results) => {
            this.refsetOptions = results.items.filter((item) => item.refsetId !== this.activeRefset.refsetId);

            for (const option of this.refsetOptions) {
                option.flagIcon = RefsetUtility.getEditionFlagIcon(option.edition?.branch);
            }

            this.refsetOptionsLoading = false;
        });
    }

    comparisonRefsetSelected(event) {

        const comparisonRefset = event.value;
        this.comparisonRefsetVersionOptions = RefsetUtility.getVersionOptions(comparisonRefset);
        this.comparisonRefsetName = comparisonRefset.name;
    }

    checkComplete() {
        return this.comparisonRefsetInternalId != null;
    }

    launchComparison() {

        this.refsetDetails.changeLockedStatus(true);

        this.refsetService.launchComparison(this.activeRefset.id, this.comparisonRefsetInternalId).subscribe((x) => {
            this.refsetDetails.changeLockedStatus(false);
        });

        UiUtility.manageProcessNotifications(this.activeRefset.id, this.activeRefset.refsetId, RefsetUtility.IN_DEVELOPMENT, this.showComparison, this.notificationService, this.refsetService, this.router, 'comparison');

        this.openedModel.close();
        this.openedModel = null;
    }

    showComparison = () => {

        this.openedModel = this.modalService.open(this.showComparisonDialog, { backdrop: 'static', keyboard: false, windowClass: 'show-comparison-dialog', size: 'lg' });

        this.gridOptions = {
            context: { componentParent: this },
            pagination: true,
            suppressColumnVirtualisation: false, // need this so you can access rows and cells that might not be currently visible, including if the grid is hidden
            suppressPaginationPanel: true,
            paginationPageSize: this.gridPaging.pageSize,
            rowSelection: 'single',
            enableCellTextSelection: true,
            onCellClicked: this.onGridCellClick,
            onGridReady: this.onGridReady,
            frameworkComponents: {
                templateRenderer: TemplateRenderer,
                'categoryFilterComponent': CategoryFilterComponent
            },
            defaultColDef: {
                sortable: true,
                resizable: true,
                sortingOrder: ['asc', 'desc'],
                suppressMenu: true,
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

        this.gridColumnDefs = [
            { field: 'code', colId: 'code', headerName: 'Concept ID', minWidth: 120, tooltipField: 'code', resizable: false, cellRenderer: 'templateRenderer', cellRendererParams: { template: this.codeSection }, unSortIcon: true },
            { field: 'name', tooltipField: 'name', headerName: 'Concept Name (PT)', flex: 1, resizable: true, minWidth: 300, sort: 'asc', unSortIcon: true },
            {
                field: 'membership', colId: 'membership', headerName: 'Reference Set Membership', minWidth: 120, tooltipField: 'code', resizable: false, unSortIcon: true,
                floatingFilterComponent: 'categoryFilterComponent', floatingFilterComponentParams: {
                    suppressMenu: true, suppressFilterButton: true, names: [
                        { type: 'membership', name: 'Active Reference Set', value: 'Active Reference Set' },
                        { type: 'membership', name: 'Comparison Reference Set', value: 'Comparison Reference Set' },
                        { type: 'membership', name: 'Both', value: 'Both' },
                    ]
                }
            }
        ];

        this.showTable = true;

        // set placeholders on the grid floating filter fields
        UiUtility.applyGridPlaceholders('#comparisonGridSection .ag-floating-filter-full-body .ag-input-field-input');

        this.activeRefsetName = this.activeRefset.name;

        if (this.comparisonTypeSelected == 'same_refset') {

            const comparisonVersionInfo = this.activeRefset.versionList.find((element) => { return element.refsetInternalId == this.comparisonRefsetInternalId; });
            this.comparisonRefsetName = this.activeRefsetName;
            this.comparisonRefsetVersionDate = comparisonVersionInfo.date;
            this.comparisonRefsetStatus = comparisonVersionInfo.status;
        } else {

            const comparisonVersionInfo = this.comparisonRefsetVersionOptions.find((element) => { return element.value == this.comparisonRefsetInternalId; });
            this.comparisonRefsetVersionDate = comparisonVersionInfo.date;
            this.comparisonRefsetStatus = comparisonVersionInfo.status;
        }

        if (this.activeRefset.availableActions?.includes('FINISH_EDIT')) {
            this.allowedToEdit = true;
        }

    }

    closeShowComparisonModal() {

        if (this.allowedToEdit && !this.isLocked) {
            window.location.reload();
        }

        this.openedModel.dismiss();
    }

    onGridReady = (gridReadyParams) => {

        this.gridApi = gridReadyParams.api;

        this.refsetService.getComparisonData(this.activeRefset.id).subscribe({
            next: (results) => {

                results.total = results.items.length;
                results.totalKnown = true;
                this.comparisonData = results;
                console.log(results);
                const pageNumber = 1;

                if (results.items.length == 0) {

                    this.gridApi.showNoRowsOverlay();
                    this.gridApi.setRowData([]);

                    if (pageNumber > 1) {

                        this.gridPaging.totalRows = this.gridApi.paginationGetPageSize() * (pageNumber - 1);
                        this.gridPaging.totalKnown = true;
                        this.paginationComponent.goToPage(pageNumber - 1);
                    }

                    return;
                }

                UiUtility.applyServerPagedGridResults(results, this.gridApi, this.gridPaging, pageNumber, null, false);
            },
            error: (error) => {

                this.gridApi.showNoRowsOverlay();
                this.gridApi.setRowData([]);
            }
        });
    }

    onGridCellClick = (event) => {

        const selectedRows = this.gridApi.getSelectedRows();
        let selectedId: string;

        selectedRows.forEach(function (selectedRow, index) {
            selectedId = selectedRow.code;
        });

        const selectedConcept = this.getGridRow(selectedId);
        this.loadConceptDetail(selectedConcept);
    }

    getGridRow(conceptId: string) {

        let concept;

        for (let i = 0; i < this.comparisonData.items.length; i++) {

            if (this.comparisonData.items[i].code == conceptId) {

                concept = this.comparisonData.items[i];
                break;
            }
        }

        return concept;
    }

    getGridPageSize() {

        let size = this.gridPaging.pageSize;

        if (this.gridApi) {
            size = this.gridApi.paginationGetPageSize();
        }

        return size;
    }

    loadConceptDetail(concept) {

        this.selectedConcept = concept;
        this.conceptDetail = null;
        this.isConceptDetailsLoading = true;

        this.refsetService.getMembersDetails(concept?.code, { refsetInternalId: this.activeRefset.id, }).subscribe({
            next: (results) => {

                this.isConceptDetailsLoading = false;
                //this.showLoadingSpinner = false;
                this.conceptDetail = results;
                this.conceptDetail.roleGroups = results.roleGroups;
                this.conceptDetail.numRoleGroups = Object.keys(this.conceptDetail.roleGroups).length;

                this.conceptDetail.descriptions = this.conceptDetail.descriptions.filter(
                    function (description) {
                        return description != null;
                    }
                );

                RefsetUtility.sortDescriptions(this.conceptDetail.descriptions, this.activeRefset.edition.fullyQualifiedLanguageRefsets);
            },
            error: (error) => {

                this.isConceptDetailsLoading = false;
            }
        });

        this.loadConceptDetailParents(concept);
    }

    loadConceptDetailParents(concept, language = RefsetUtility.DEFAULT_ACCEPT_LANGUAGE) {

        this.conceptDetailParents = [];

        if (!CodeUtility.testBoolean(concept?.active) || !CodeUtility.testBoolean(concept?.memberOfRefset)) {
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
        this.refsetService.getConceptList(this.activeRefset.id, restParams).subscribe((results) => {
            this.conceptDetailParents = results.items;
        });
    }

    closeConceptDetails() {

        this.conceptDetail = null;
        this.selectedConcept = null;

    }

    sendLoadingSpinnerTrigger = (value: any) => {
        this.loadingSpinner.emit(value);
    }

    sendChangeLockedStatus = (value: boolean) => {
        this.changeLockedStatus.emit(value);
    }

    indicateChanges(data) {

        this.showLoadingSpinner = true;
        this.sendChangeLockedStatus(true);

        console.timeEnd('comparison indicateChanges');
    }

    addRemoveConcept(params: any): void {

        this.isConceptBeingAdded = new Boolean(params.addConcept) as boolean;

        // if this is coming from the parents section than the concept has children
        if (params.isParentConcept) {
            params.concept.hasChildren = true;
        }

        this.conceptForAddRemove = params.concept;
        this.addRemoveDefinitionExceptionType = params.definitionExceptionType;

        console.timeEnd('comparison addRemoveConcept');
        this.indicateChanges(null);
    }

    addRemoveConceptGroup(params: any): void {

        this.showLoadingSpinner = true;
        let operation = 'add';

        if (!params.addConcept) {
            operation = 'remove';
        }

        const concepts = params.concepts.join(',');

        RefsetUtility.addRemoveMembersByList(this.activeRefset.id, this.activeRefset.refsetId, concepts, operation, this.processChangedMemberEffects, this.notificationService, this.refsetService, this.router);
    }

    public processChangedMemberEffects = (conceptStatusArray) => {

        console.timeEnd('comparison processChangedMemberEffects');
        const thatConceptDetail = this.conceptDetail;
        const filterModel = this.gridApi.getFilterModel();

        // re-cache the members for the taxonomy
        this.refsetService.cacheMemberAncestors(this.activeRefset.refsetId, RefsetUtility.getVersionDateForRefsetApiCall(this.activeRefset)).subscribe({
            next: results => {

                const success = results?.success;

                if (!CodeUtility.testBoolean(success)) {
                    console.log('Error caching reference set member details.');
                }

                // reload the concept details if it is open
                if (thatConceptDetail != null) {
                    this.loadConceptDetail(thatConceptDetail);
                }
            }
        });

        this.sendChangeLockedStatus(false);
        UiUtility.toggleLockedSections(false);
        this.showLoadingSpinner = false;

        if (this.conceptDetail != null) {

            this.conceptDetail = null;
            this.isConceptDetailsLoading = true;
        }

        // if this modal is closed and the same refset is still open then refsesh the page
        if (!this.modalService.hasOpenModals() && this.router.url.includes('/' + this.activeRefset.refsetId)) {

            this.refsetDetails.ngOnInit();
            return;
        }

        // process the comparison data with the changed members
        for (const conceptStatus of conceptStatusArray) {

            if (conceptStatus.failed) {
                continue;
            }

            this.changeReportData.push({ 'Concept ID': conceptStatus.code, 'Concept Name': conceptStatus.name, Operation: conceptStatus.operation });

            const comparisonRowIndex = this.comparisonData.items.findIndex((element) => { return element.code == conceptStatus.code; });

            if (conceptStatus.added) {

                this.comparisonData.activeRefsetMemberTotal += 1;

                if (comparisonRowIndex >= 0) {

                    this.comparisonData.items[comparisonRowIndex].memberOfRefset = 'true';
                    this.comparisonData.items[comparisonRowIndex].membership = 'Both';
                    this.comparisonData.comparisonRefsetDistinctMembersCount -= 1;

                    const distinctIndex = this.comparisonData.comparisonRefsetDistinctMembers.indexOf(conceptStatus.code);
                    this.comparisonData.comparisonRefsetDistinctMembers.splice(distinctIndex, 1);

                } else {

                    const concept = {
                        code: conceptStatus.code,
                        definitionExceptionType: null,
                        hasChildren: 'false',
                        memberOfRefset: 'true',
                        name: conceptStatus.name,
                        active: conceptStatus.active,
                        membership: 'Active Reference Set'
                    };

                    this.comparisonData.items.push(concept);
                    this.comparisonData.activeRefsetDistinctMembersCount += 1;
                    this.comparisonData.activeRefsetDistinctMembers.push(conceptStatus.code);
                }

            } else {

                this.comparisonData.activeRefsetMemberTotal -= 1;
                this.comparisonData.items[comparisonRowIndex].memberOfRefset = 'false';

                if (this.comparisonData.items[comparisonRowIndex].membership == 'Both') {

                    this.comparisonData.items[comparisonRowIndex].membership = 'Comparison Reference Set'
                    this.comparisonData.comparisonRefsetDistinctMembersCount += 1;
                    this.comparisonData.comparisonRefsetDistinctMembers.push(conceptStatus.code);

                } else {

                    this.comparisonData.items.splice(comparisonRowIndex, 1);
                    this.comparisonData.activeRefsetDistinctMembersCount -= 1;

                    const distinctIndex = this.comparisonData.activeRefsetDistinctMembers.indexOf(conceptStatus.code);
                    this.comparisonData.activeRefsetDistinctMembers.splice(distinctIndex, 1);
                }
            }
        }

        this.gridApi.setRowData(this.comparisonData.items);
        this.gridApi.redrawRows();
        this.gridApi.setFilterModel(filterModel);
        this.gridApi.onFilterChanged();
        this.gridPaging.totalRows = this.comparisonData.items.length;
    }

    downloadComparisonReport() {

        let activeRefsetDate = this.activeRefsetVersionDate;
        let comparisonRefsetDate = this.comparisonRefsetVersionDate;

        if (this.activeRefset.versionStatus == RefsetUtility.IN_DEVELOPMENT) {
            activeRefsetDate = '(In Development)';
        }

        if (this.comparisonRefsetStatus == RefsetUtility.IN_DEVELOPMENT) {
            comparisonRefsetDate = '(In Development)';
        }

        const members: any[] = [];
        const activeRefset = this.comparisonData.activeRefsetName + ' ' + activeRefsetDate + ' (' + this.comparisonData.activeRefsetId + ')';
        const comparisonRefset = this.comparisonData.comparisonRefsetName + ' ' + comparisonRefsetDate + ' (' + this.comparisonData.comparisonRefsetId + ')';
        const bothRefsets = this.comparisonData.activeRefsetName + ' ' + activeRefsetDate + ' (' + this.comparisonData.activeRefsetId + ') ; ' +
            this.comparisonData.comparisonRefsetName + ' ' + comparisonRefsetDate + ' (' + this.comparisonData.comparisonRefsetId + ')';

        for (const row of this.comparisonData.items) {

            let refset = '';

            if (row.membership == 'Active Reference Set') {
                refset = activeRefset;
            } else if (row.membership == 'Both') {
                refset = bothRefsets;
            } else {
                refset = comparisonRefset;
            }

            members.push({ 'Concept ID': row.code, 'Concept Name': row.name, 'Reference Set Membership': row.membership, 'Reference Set Name': refset });
        }

        members.sort(function (a, b) {

            const sortTermA = a['Reference Set Membership'].toUpperCase() + a['Concept Name'].toUpperCase();
            const sortTermB = b['Reference Set Membership'].toUpperCase() + b['Concept Name'].toUpperCase();

            if (sortTermA < sortTermB) {
                return -1;

            } else if (sortTermA > sortTermB) {
                return 1;

            } else {
                return 0;
            }
        });

        activeRefsetDate = activeRefsetDate.replace(' ', '_');
        comparisonRefsetDate = comparisonRefsetDate.replace(' ', '_');

        const fileName = 'Comparison_Active_Refset_' + this.activeRefset.refsetId + '_' + activeRefsetDate + '_To_Refset_' +
            this.comparisonData.comparisonRefsetId + '_' + comparisonRefsetDate + '_' + new Date().toLocaleDateString();

        UiUtility.downloadFile(members, ['Concept ID', 'Concept Name', 'Reference Set Membership', 'Reference Set Name'], fileName);
    }

    downloadChangeReport() {

        this.changeReportData;

        let activeRefsetDate = this.activeRefsetVersionDate;

        if (this.activeRefset.versionStatus == RefsetUtility.IN_DEVELOPMENT) {
            activeRefsetDate = '(In_Development)';
        }

        this.changeReportData.sort(function (a, b) {

            const sortTermA = a['Operation'].toUpperCase() + a['Concept Name'].toUpperCase();
            const sortTermB = b['Operation'].toUpperCase() + b['Concept Name'].toUpperCase();

            if (sortTermA < sortTermB) {
                return -1;

            } else if (sortTermA > sortTermB) {
                return 1;

            } else {
                return 0;
            }
        });

        activeRefsetDate = activeRefsetDate.replace(' ', '_');

        const fileName = 'Comparison_Change_Report_Refset_' + this.activeRefset.refsetId + '_' + activeRefsetDate + '_' + new Date().toLocaleDateString();

        UiUtility.downloadFile(this.changeReportData, ['Concept ID', 'Concept Name', 'Operation'], fileName);
    }

    showFlagIcon(event, show) {

        if (show) {
            event.target.style.display = 'inline';
        } else {
            event.target.style.display = 'none';
        }
    }

    openInNewWindow(conceptId: string): void {
        const snomedBrowserUrl =
            environment["snomedBrowserUrl"] +
            "&conceptId1=" +
            conceptId +
            "&edition=" +
            this.refsetBranchPath;
        window.open(snomedBrowserUrl);
    }
}
