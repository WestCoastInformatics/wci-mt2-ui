import { templateJitUrl } from '@angular/compiler';
import { AfterViewInit, ChangeDetectorRef, Component, ElementRef, Input, OnChanges, OnInit, SimpleChanges, TemplateRef, ViewChild } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { NgbModal } from '@ng-bootstrap/ng-bootstrap';
import { GridApi } from 'ag-grid-community';
import { OptionsFactory } from 'ag-grid-community/dist/lib/filter/provided/optionsFactory';
import { BehaviorSubject, Observable } from 'rxjs';
import { Debounce } from 'src/app/decorators/debounce.decorator';
import { RefsetDetails } from 'src/app/pages/refset-details';
import { RefsetService } from 'src/app/services/rest/refset.service';
import { UiUtility } from 'src/app/utilities/ui.utility';
import { AddRemoveConceptsComponent } from '../add-remove-concepts/add-remove-concepts.component';
import { TemplateRenderer } from '../cellRenderers/template.renderer';
import { PaginationComponent } from '../pagination/pagination.component';
import { UpgradeModalComponent } from '../upgrade-modal/upgrade-modal.component';
import { RefsetUtility } from "src/app/utilities/refset.utility";

@Component({
  selector: 'adjudicate-upgrade-modal',
  templateUrl: './adjudicate-upgrade-modal.component.html'
})
export class AdjudicateUpgradeModalComponent implements OnInit, AfterViewInit, OnChanges {

  @Input()
  refsetData: any;
  @Input()
  membersOfRefset: any;
  @Input()
  inactiveConcepts: any;
  @Input()
  membersInCommon: any;
  numOfResults: any;
  numOfMembers: any;
  selectedLanguage = '';
  languageOptions = [];
  hideReplacements = false;
  refsetGridLastFilter: string = '';
  refsetGridLastSort: string = '';
  selectedTaxonomyLanguage: string = RefsetUtility.DEFAULT_ACCEPT_LANGUAGE + ":" + RefsetUtility.DEFAULT_LANGUAGE_TYPE;
  @ViewChild('adjudicatePaging') paginationComponent: PaginationComponent;
  @ViewChild('inactiveConceptCodeSection') inactiveCodeSection: TemplateRef<any>;
  @ViewChild('adjudicateInactiveId') inactiveIdSection: TemplateRef<any>;
  @ViewChild('adjudicateInactiveEnPtSection') inactiveEnPtSection: TemplateRef<any>;
  @ViewChild('adjudicateInactiveEnFsnSection') inactiveEnFsnSection: TemplateRef<any>;
  @ViewChild('adjudicateInactiveFrPtSection') inactiveFrPtSection: TemplateRef<any>;
  @ViewChild('adjudicateInactiveNlPtSection') inactiveNlPtSection: TemplateRef<any>;
  @ViewChild('adjudicateInactivationReason') inactivationReason: TemplateRef<any>;
  @ViewChild('replacementConceptCodeSection') replacementCodeSection: TemplateRef<any>;
  @ViewChild('adjudicateReplacementId') replacementIdSection: TemplateRef<any>;
  @ViewChild('adjudicateReplacementEnPtSection') replacementEnPtSection: TemplateRef<any>;
  @ViewChild('adjudicateReplacementEnFsnSection') replacementEnFsnSection: TemplateRef<any>;
  @ViewChild('adjudicateReplacementFrPtSection') replacementFrPtSection: TemplateRef<any>;
  @ViewChild('adjudicateReplacementNlPtSection') replacementNlPtSection: TemplateRef<any>;
  @ViewChild('adjudicateReason') reasonSection: TemplateRef<any>;
  @ViewChild('actionSection') actionSection: TemplateRef<any>;

  gridOptions: any;
  columnDefs: any;
  refsetGridOptions: any;
  refsetGridPaging = {
    pageSize: 100,
    pageSizeOptions: [5, 10, 25, 50],
    totalKnown: false,
    totalRows: null,
  };
  originalGridParams: any;
  refsetGridApi: any;
  refsetGridColumnApi: any;
  isConceptBeingAdded: Boolean;
  conceptForAddRemove: any;
  addRemoveDefinitionExceptionType: any;
  isLocked = false;
  isInactive: boolean;
  isReplacement: boolean;
  resetRefsetTotal = false;
  changeMethod = '';
  selectedRow: any;
  selectedConcepts: any;
  isConceptDetailsLoading = false;
  conceptDetail: any;
  conceptDetailParents: any;
  conceptDescriptions: any;
  conceptSelected: boolean;
  refsetInternalId: string;
  selectedConcept: any;
  numOfChildren = undefined;
  chosenConceptCode: any;
  replacementCode: string;
  concept: any;
  showActionButton = true;
  disableAddRemove = false;
  membersInCommonForChangeReport = { items: [] };
  manualReplacementOptionsLoading = false;
  addReplacementFlag = false;

  constructor(private readonly modalService: NgbModal,
    private readonly refsetService: RefsetService,
    readonly refsetDetails: RefsetDetails,
    private readonly changeDetection: ChangeDetectorRef,
    private readonly route: ActivatedRoute,
    readonly upgradeModalComponent: UpgradeModalComponent,
    private readonly addRemoveConceptsComponent: AddRemoveConceptsComponent) { }

  ngOnInit(): void {
    this.languageOptions = this.refsetData?.edition?.fullyQualifiedLanguageRefsets.map((x) => {
      return x.qualifiedLanguageCode;
    });
    this.selectedLanguage = this.languageOptions[0];
  }

  ngAfterViewInit() {

    this.columnDefs = [
      { field: 'inactivationReason', tooltipField: 'inactivationReason', headerName: 'Inactivation Reason', cellClass: 'adjudicate-column-inactivationReason', flex: 1, minWidth: 190, maxWidth: 210, cellRenderer: 'templateRenderer', cellRendererParams: { template: this.inactivationReason } },
      { field: 'inactiveCode', sortable: true, tooltipField: 'inactiveCode', headerName: '', cellClass: 'adjudicate-column-inactiveCode', cellRenderer: 'templateRenderer', floatingFilter: false, cellRendererParams: { template: this.inactiveCodeSection }, flex: 1, minWidth: 60, width: 60, maxWidth: 60 },
      { field: 'inactiveId', tooltipField: 'inactiveId', headerName: 'Inactive ID', cellClass: 'adjudicate-column-inactiveId', cellRenderer: 'templateRenderer', cellRendererParams: { template: this.inactiveIdSection }, flex: 1, minWidth: 110, maxWidth: 120 },
      { field: 'inactiveEnPtSection', tooltipField: 'inactiveEnPtSection', headerName: 'Inactive ' + this.selectedLanguage, cellClass: 'adjudicate-column-inactiveEnPtSection', flex: 1, minWidth: 235, cellRenderer: 'templateRenderer', cellRendererParams: { template: this.inactiveEnPtSection } },
      { field: 'reason', tooltipField: 'reason', headerName: 'Association', cellClass: 'adjudicate-column-reason', flex: 1, minWidth: 220, maxWidth: 220, cellRenderer: 'templateRenderer', cellRendererParams: { template: this.reasonSection }, colSpan: params => params.data.isSearch === true ? 4 : 1 },
      { field: 'replacementCode', tooltipField: 'replacementCode', headerName: '', cellClass: 'adjudicate-column-replacementCode', flex: 1, minWidth: 60, width: 60, maxWidth: 70, cellRenderer: 'templateRenderer', floatingFilter: false, cellRendererParams: { template: this.replacementCodeSection } },
      { field: 'replacementId', tooltipField: 'replacementId', headerName: 'Replacement ID', cellClass: 'adjudicate-column-replacementId', flex: 1, minWidth: 150, maxWidth: 160, cellRenderer: 'templateRenderer', cellRendererParams: { template: this.replacementIdSection } },
      { field: 'replacementEnPtSection', tooltipField: 'replacementEnPtSection', headerName: 'Replacement ' + this.selectedLanguage, cellClass: 'adjudicate-column-replacementEnPtSection', flex: 1, minWidth: 235, cellRenderer: 'templateRenderer', cellRendererParams: { template: this.replacementEnPtSection } },
      { field: 'actionSection', tooltipField: 'actionSection', headerName: '', cellClass: 'adjudicate-column-actionSection', flex: 1, minWidth: 60, width: 60, maxWidth: 60, cellRenderer: 'templateRenderer', floatingFilter: false, cellRendererParams: { template: this.actionSection } },
    ];

    this.refsetGridOptions = {
      context: { componentParent: this },
      pagination: true,
      suppressColumnVirtualisation: false, // need this so you can access rows and cells that might not be currently visible, including if the grid is hidden
      suppressPaginationPanel: true,
      paginationPageSize: this.refsetGridPaging.pageSize,
      enableCellTextSelection: true,
      rowSelection: 'single',
      onGridReady: this.onGridReady,
      onCellClicked: this.onGridCellClick,
      frameworkComponents: {
        'templateRenderer': TemplateRenderer,
      },
      defaultColDef: {
        sortable: true,
        filter: true,
        floatingFilter: true,
        floatingFilterComponentParams: { placeholder: '', suppressFilterButton: true },
        suppressMenu: true,
        menuTabs: ['columnsMenuTab'],
        resizable: true,
      },

    };

  }

  onCellMouseOver(params) {
    this.selectedRow = params;
  }

  onGridCellClick = (event) => {
    this.selectConcept(event.data);
  }

  getSelectedRowData(option: string) {
    console.log(this.selectedRow?.rowIndex);
    console.log(this.selectedRow?.data);
    const newItem = { ...this.selectedRow?.data, isHidden: true, isSearch: true };
    newItem.inactivationReason = '';
    newItem.descriptions = '';
    newItem.replacementConcecpts = '';
    if (option.includes('add')) {
      this.chosenConceptCode = this.selectedRow['data'].code;
      this.refsetGridApi.applyTransaction({ add: [newItem], addIndex: this.selectedRow?.rowIndex + 1 });
    } else if (option.includes('remove')) {
      this.refsetGridApi.applyTransaction({ remove: [this.selectedRow?.data] });
    }
    this.selectedConcepts = undefined;
  }

  addRemoveConcept(params: any, changeMethod: string): void {
    if (!this.disableAddRemove) {
      this.addRemoveConceptsComponent.changeMethod = changeMethod;
      this.addRemoveConceptsComponent.refset = this.refsetData;
      this.addRemoveConceptsComponent.processChangedMemberFunction = this.processChangedMemberEffects;
      this.addRemoveConceptsComponent.refsetInternalId = this.refsetData.id;
      this.addRemoveConceptsComponent.addRemoveConceptsForAdjudication(params, params.replacementConcecpts[0]);
      this.disableAddRemove = true;
    }
  }

  async onSearchChange(value): Promise<void> {
    await this.search(value);
  }

  handleInput(event: KeyboardEvent): void {
    event.stopPropagation();
  }

  @Debounce()
  search(value: string): void {

    this.manualReplacementOptionsLoading = true;
    this.selectedConcepts = undefined;

    const results = this.refsetService.getReplacementConcepts(this.refsetData.id, value).subscribe((results) => {

      this.selectedConcepts = results.items.filter((x) => {
        return x.active === true;
      });

      this.manualReplacementOptionsLoading = false;
    });
  }

  selectedConceptChanged(concept: any): void {
    this.concept = concept['value'];
  }

  removeManualReplacement(changeMethod: string): void {
    this.refsetDetails.toggleLoadingSpinner(true);
    this.refsetService.modifyMembersForUpgrade(this.refsetData.id, this.chosenConceptCode ? this.chosenConceptCode : this.selectedRow['data'].code, changeMethod, this.concept ? this.concept.code : this.selectedRow['data'].replacementConcecpts[0].code).subscribe((x) => {
      this.onGridReady(this.originalGridParams);
      this.refsetDetails.toggleLoadingSpinner(false);
    });
    this.selectedConcepts = undefined;
    this.concept = '';
  }

  addManualReplacement(changeMethod: string): void {
    if (this.concept) {
      this.refsetDetails.toggleLoadingSpinner(true);
      const body = { ...this.concept };
      this.refsetService.modifyMembersForUpgrade(this.refsetData.id, this.chosenConceptCode, changeMethod, this.concept.code, JSON.stringify(body)).subscribe((x) => {  
        // force auto-add of the replacement concept to the refset
        this.addReplacementFlag = true;
        this.onGridReady(this.originalGridParams);
        this.refsetDetails.toggleLoadingSpinner(false);
      });
    }
    this.selectedConcepts = undefined;
  }

  changeLockedStatus(lock: boolean) {

    this.isLocked = lock;
    this.refsetDetails.toggleLoadingSpinner(false);
    UiUtility.toggleLockedSections(lock);
  }

  processChangedMemberEffects = (conceptStatusArray) => {

    this.changeLockedStatus(false);
    this.refsetDetails.showLoadingSpinner = true;

    this.onGridReady(this.originalGridParams);
    this.refsetDetails.showLoadingSpinner = false;
    this.disableAddRemove = false;
  }

  hideIncludedReplacements(toggle: any): void {
    this.hideReplacements = toggle.checked;
    this.onGridReady(this.originalGridParams);
  }

  formatReason(reason: string): string {
    return reason?.split('_').join(' ');
  }

  transformDescriptions(descriptions: any, isOption = false) {
    if (descriptions) {

      const getStringifiedJSON = descriptions.substring(1, descriptions.length - 1);
      if (getStringifiedJSON) {
        const formattedObjectArray = getStringifiedJSON.slice(1).split('{"descriptionId"').map((x) => {
          if (x[x.length - 1] === ',') {
            const modifiedString = x.slice(0, -1);
            x = modifiedString;
          }
          if (!x.includes('"descriptionId"')) {
            x = '{"descriptionId"' + x;
          } else if (!x.includes('{"descriptionId"') && x.includes('"descriptionId"')) {
            x = '{' + x;
          }
          if (x.includes(',null')) {
            x = x.replaceAll(',null', '');
          }
          if (x[x.length - 1] !== '}' && x[x.length - 2] !== '"') {
            x = x + '"}';
          }
          return JSON.parse(x);
        });
        return formattedObjectArray.filter((x) => {
          if (isOption) {
            return x.language === this.getLanguageAndType(isOption)[0] && x.type === this.getLanguageAndType(isOption)[1];
          } else {
            return x.languageName === this.selectedLanguage;
          }
        });
      }
    }
  }


  transformManualReplacementDescriptions(descriptions: any) {
    if (descriptions) {
      return JSON.parse(descriptions).filter((x) => {
        return x.language === this.getLanguageAndType()[0] && (x.type === this.getLanguageAndType()[1] || x.type === this.getLanguageAndType()[2]);
      });
    }
  }

  getLanguageAndType(isOption = false): string[] {
    let language = '';
    let type = '';
    if (isOption) {
      language = 'en';
      type = 'FSN';
    } else {
      language = this.selectedLanguage.split(' ')[0].toLowerCase();
      type = this.selectedLanguage.split(' ')[1].split('(')[1].split(')')[0];
    }
    let type2 = '';
    if (type === 'PT') {
      type2 = 'SYNONYM';
    }

    return [language, type, type2];
  }

  ngOnChanges(changes: SimpleChanges): void {
  }

  openAdjudicateUpgradeModal(adjudicateUpgradeDialog: NgbModal) {
    this.modalService.dismissAll();
    this.modalService.open(adjudicateUpgradeDialog, {
      backdrop: 'static',
      keyboard: false,
      windowClass: 'adjudicate-upgrade-modal',
      centered: true
    });
  }

  changeLanguage($event: any) {
    this.onGridReady(this.originalGridParams);
  }

  onGridReady = (gridReadyParams) => {
    this.showActionButton = true;
    this.originalGridParams = gridReadyParams;
    this.refsetGridApi = gridReadyParams.api;
    this.refsetGridColumnApi = gridReadyParams.columnApi;

    // this.refsetGridApi.showLoadingOverlay();
    this.refsetDetails.showLoadingSpinner = true;

    let pageNumber = this.refsetGridApi.paginationGetPageSize();
    let filter = UiUtility.formatFilterData(gridReadyParams.filterModel);

    let newFilterString = filter;

    this.refsetGridLastFilter = newFilterString;


    let restParams: any = {
      displayType: "list",
      limit: this.refsetGridApi.paginationGetPageSize(),
      offset: pageNumber - 1
    };

    this.refsetService.getUpgradeData(this.refsetData?.id, restParams).subscribe(results => {

      results.items = results.items.filter((x) => {
        if (this.hideReplacements) {
          return !x.replaced;
        }
        return x.active === false;
      });

      results.items.sort(function (a, b) {
        let nameA = a.replacementConcecpts[0].reason.toUpperCase();
        let nameB = b.replacementConcecpts[0].reason.toUpperCase();
        if (nameA > nameB) {
          return -1;
        }
        if (nameA < nameB) {
          return 1;
        }

        return 0;
      });

      let finalResults = [];
      let changeReportResults = [];

      results.items.forEach((item) => {
        for (let i = 0; i < item.replacementConcecpts.length; i++) {
          changeReportResults.push(item);
        }
      });

      this.numOfResults = results.items.length;
      this.membersInCommonForChangeReport.items = changeReportResults;
      console.log(this.membersInCommonForChangeReport);

      results.items.forEach((item) => {
        for (let i = 0; i < item.replacementConcecpts.length; i++) {
          if (i === 0) {
            finalResults.push(item);
          } else {
            const newItem = { ...item, isHidden: true };

            newItem.inactivationReason = '';
            newItem.descriptions = '';
            newItem.replacementConcecpts = [item.replacementConcecpts[i]];
            // if auto adding manual replacement to the refset, do it here, when the item's replacements are fully populated
            if (this.addReplacementFlag && (item.replacementConcecpts[i].code == this.concept.code)) {
              this.addRemoveConceptsComponent.changeMethod = "REPLACEMENT_ADDED";
              this.addRemoveConceptsComponent.refset = this.refsetData;
              this.addRemoveConceptsComponent.processChangedMemberFunction = this.processChangedMemberEffects;
              this.addRemoveConceptsComponent.refsetInternalId = this.refsetData.id;
              this.addRemoveConceptsComponent.addRemoveConceptsForAdjudication(newItem, newItem.replacementConcecpts[0]);
              this.addReplacementFlag = false;
            }
            finalResults.push(newItem);
          }
        }
      });

      results.items = finalResults;
      this.membersInCommon = results;
      // console.log(results.items)

      if (results.items.length == 0) {

        this.refsetGridApi.showNoRowsOverlay();
        this.refsetGridApi.setRowData([]);

        if (pageNumber > 1) {

          this.refsetGridPaging.totalRows = this.refsetGridApi.paginationGetPageSize() * (pageNumber - 1);
          this.refsetGridPaging.totalKnown = true;
          this.paginationComponent?.goToPage(pageNumber - 1);
        }

        this.refsetDetails.showLoadingSpinner = false;

        return;
      }

      UiUtility.applyServerPagedGridResults(results, this.refsetGridApi, this.refsetGridPaging, pageNumber, null, false);
      this.refsetDetails.showLoadingSpinner = false;

    },
      error => {

        this.refsetGridApi.showNoRowsOverlay();
        this.refsetGridApi.setRowData([]);
        this.refsetDetails.toggleLoadingSpinner(false);
      });


    // set placeholders on the grid floating filter fields
    document.querySelectorAll('.ag-floating-filter-full-body .ag-input-field-input').forEach((obj: any) => {

      let label = obj.getAttribute('aria-label');
      let value = label.substring(0, label.indexOf('Filter Input')) + '...';
      obj.setAttribute('placeholder', value);
    });
    this.changeDetection.detectChanges();
  }

  getInactiveChangeReport(): void {
    const memberItems = this.membersInCommon.items;
    const inactiveConcepts = memberItems.filter((items: any) => {
      return items?.active == false;
    });
    let data = [];
    for (let i = 0; i < inactiveConcepts.length; i++) {
      data.push({
        'Inactivation Reason': inactiveConcepts[i].inactivationReason ? inactiveConcepts[i].inactivationReason : '',
        'Inactive ID': inactiveConcepts[i].inactivationReason ? inactiveConcepts[i].code : '',
        'Inactive Concept': inactiveConcepts[i].descriptions ? this.upgradeModalComponent.transformDescriptions(inactiveConcepts[i].descriptions).term.replaceAll(',', '/') : '',
        'Suggested Replacement Association': inactiveConcepts[i].replacementConcecpts ? inactiveConcepts[i].replacementConcecpts[0].reason : '',
        'Suggested Replacement ID': inactiveConcepts[i].replacementConcecpts ? inactiveConcepts[i].replacementConcecpts[0].code : '',
        'Suggested Replacement Concept': this.upgradeModalComponent.transformDescriptions(inactiveConcepts[i].replacementConcecpts ? inactiveConcepts[i].replacementConcecpts[0].descriptions : '').term.replaceAll(',', '/')
      });
    }

    UiUtility.createInactiveChangeReport(this.refsetData.refsetId, data);

  }

  getFinishedChangeReport(): void {

    // this.refsetService.getUpgradeData(this.refsetData.id, '').subscribe((members) => {
    // this.membersInCommon = members;
    // console.log(this.membersInCommon);
    // Get old members from inactive concepts
    let memberItems = this.membersInCommonForChangeReport?.items;
    let inactiveConcepts = [];
    memberItems.forEach((items: any) => {
      if (items.replacementConcecpts) {
        for (let item of items.replacementConcecpts) {
          if (item.added === true) {
            inactiveConcepts.push(item);
          }
        }
      }
    });

    let newMembers = [];
    for (let concept of inactiveConcepts) {
      if (!Boolean(newMembers.some((x) => {
        return x['New Member ID'] === concept.code;
      }))) {
        newMembers.push({
          'New Member ID': concept.code,
          'New Member Concept': this.upgradeModalComponent.transformDescriptions(concept.descriptions).term.replaceAll(',', '/')
        });
      }
    }

    // Get new members from inactive concepts
    inactiveConcepts = [];
    memberItems.forEach((item: any) => {
      if (item.replaced === true) {
        inactiveConcepts.push(item);
      }
    });
    let oldMembers = [];
    for (let concept of inactiveConcepts) {
      if (!Boolean(oldMembers.some((x) => {
        return x['Old Member ID'] === concept.code;
      }))) {
        oldMembers.push({
          'Old Member ID': concept.code,
          'Old Member Concept': this.upgradeModalComponent.transformDescriptions(concept.descriptions).term.replaceAll(',', '/')
        });
      }
    }

    // Get manual replacements from inactive concepts
    inactiveConcepts = [];
    memberItems.forEach((items: any) => {
      if (items.replacementConcecpts) {
        for (let item of items.replacementConcecpts) {
          if (item.reason === 'MANUAL_REPLACEMENT') {
            inactiveConcepts.push(item);
          }
        }
      }
    });

    let manualReplacement = [];
    for (let concept of inactiveConcepts) {
      if (!Boolean(manualReplacement.some((x) => {
        return x['Manual Replacement ID'] === concept.code;
      }))) {
        manualReplacement.push({
          'Manual Replacement ID': concept.code,
          'Manual Replacement Concept': this.upgradeModalComponent.transformDescriptions(concept.descriptions).term.replaceAll(',', '/')
        });
      }
    }

    // Get members in common
    const membersInCommonItems = this.membersOfRefset;
    const commonConcepts = membersInCommonItems?.filter((x) => {
      return !memberItems?.includes(x.id);
    });
    console.log(commonConcepts)
    let membersInCommon = [];
    for (let i = 0; i < commonConcepts?.length; i++) {
      membersInCommon.push({
        'Members In Common ID': commonConcepts[i].code,
        'Members In Common Concept': commonConcepts[i].name.replaceAll(',', '/')
      });
    }

    const changeReportObject = {
      'oldMember': oldMembers,
      'newMember': newMembers,
      'manualReplacement': manualReplacement,
      'membersInCommon': membersInCommon
    };
    UiUtility.createFinishedChangeReport(this.refsetData?.refsetId, changeReportObject);
    // });
  }
  selectConcept(concept: any): void {

    this.conceptSelected = true;
    this.selectedConcept = concept;
    this.loadConceptDetail(concept);
  }
  getTaxonomyLanguageWithoutType() {
    return this.selectedTaxonomyLanguage.replace(/:.*$/, "");
  }

  loadConceptDetail(concept) {

    this.conceptDetail = null;
    this.isConceptDetailsLoading = true;
    this.loadConceptDetailParents(concept);

    this.refsetService
      .getMembersDetails(concept.code, {
        refsetInternalId: this.refsetInternalId,
      })
      .subscribe((results) => {

        this.isConceptDetailsLoading = false;
        this.conceptDetail = results;
        this.conceptDescriptions =
          this.conceptDetail.descriptions.filter(function (description) {
            return description != null;
          });

        RefsetUtility.sortDescriptions(this.conceptDescriptions, this.refsetData.edition.fullyQualifiedLanguageRefsets);
      });
  }

  loadConceptDetailParents(concept) {

    this.conceptDetailParents = [];

    const restParams = {
      displayType: "taxonomy",
      returnChildren: false,
      language: this.getTaxonomyLanguageWithoutType(),
      depth: 1,
      startingConceptId: concept.code,
      offset: 0,
      limit: 1000,
    };

    // load the parents
    this.refsetService.getConceptList(this.refsetInternalId, restParams).subscribe((results) => {
      this.conceptDetailParents = results.items;
    });
  }
}
