import { AfterViewInit, ChangeDetectorRef, Component, Input, OnChanges, OnInit, SimpleChanges, TemplateRef, ViewChild } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { NgbModal } from '@ng-bootstrap/ng-bootstrap';
import { RefsetDetails } from 'src/app/pages/refset-details';
import { RefsetService } from 'src/app/services/rest/refset.service';
import { UiUtility } from 'src/app/utilities/ui.utility';
import { CategoryFilterComponent } from '../categoryFilter/category-filter.component';
import { TemplateRenderer } from '../cellRenderers/template.renderer';
import { PaginationComponent } from '../pagination/pagination.component';
import { UpgradeModalComponent } from '../upgrade-modal/upgrade-modal.component';

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
  @Input()
  selectedVersion: any
  numOfResults: any;
  numOfMembers: any;
  selectedLanguage = '';
  languageOptions = [];
  hideReplacements = false;
  refsetGridLastFilter: string = '';
  refsetGridLastSort: string = '';
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
  gridOptions: any;
  columnDefs: any;
  refsetGridOptions: any;
  refsetGridPaging = {
    pageSize: 6,
    pageSizeOptions: [6, 12, 24, 48],
    totalKnown: false,
    totalRows: null,
};
  originalGridParams: any;
  refsetGridApi: any;
  refsetGridColumnApi: any;
  isConceptBeingAdded: Boolean;
  conceptForAddRemove: any;
  addRemoveDefinitionExceptionType: any;
  isAddRemoveInDetailsPanel: any;
  isLocked = false;
  isInactive: boolean;
  isReplacement: boolean;
  resetRefsetTotal = false;
  changeMethod = '';

  constructor(private readonly modalService: NgbModal,
    private readonly refsetService: RefsetService,
    readonly refsetDetails: RefsetDetails,
    private readonly changeDetection: ChangeDetectorRef,
    private readonly route: ActivatedRoute,
    readonly upgradeModalComponent: UpgradeModalComponent) { }

  ngOnInit(): void {
    this.languageOptions = this.refsetData?.edition?.fullyQualifiedLanguageRefsets.map((x) => {
      return x.qualifiedLanguageCode;
    });
    this.selectedLanguage = this.languageOptions[0];
    // this.getFinishedChangeReport(false);
  }

  ngAfterViewInit() {

    this.columnDefs = [
      { field: 'inactivationReason', tooltipField: 'inactivationReason', headerName: 'Inactivation Reason', cellClass: 'adjudicate-column-inactivationReason', flex: 1, minWidth: 190,maxWidth: 210, cellRenderer: 'templateRenderer', cellRendererParams: { template: this.inactivationReason } },
      { field: 'inactiveCode', sortable: true, tooltipField: 'inactiveCode', headerName: '', cellClass: 'adjudicate-column-inactiveCode', cellRenderer: 'templateRenderer', floatingFilter: false, cellRendererParams: { template: this.inactiveCodeSection }, flex: 1, minWidth: 60, width: 60,maxWidth:60},
      { field: 'inactiveId', tooltipField: 'inactiveId', headerName: 'Inactive ID', cellClass: 'adjudicate-column-inactiveId', cellRenderer: 'templateRenderer', cellRendererParams: { template: this.inactiveIdSection }, flex: 1, minWidth: 110,maxWidth:120},
      { field: 'inactiveEnPtSection', hide: this.selectedLanguage !== this.languageOptions[0], tooltipField: 'inactiveEnPtSection', headerName: 'Inactive ' + this.selectedLanguage, cellClass: 'adjudicate-column-inactiveEnPtSection', flex: 1, minWidth: 220,maxWidth:220, cellRenderer: 'templateRenderer', cellRendererParams: { template: this.inactiveEnPtSection } },
      { field: 'inactiveEnFsnSection', hide: this.selectedLanguage !== this.languageOptions[1], tooltipField: 'inactiveEnFsnSection', headerName: 'Inactive ' + this.selectedLanguage, cellClass: 'adjudicate-column-inactiveEnFsnSection', flex: 1, minWidth: 220,maxWidth:220, cellRenderer: 'templateRenderer', cellRendererParams: { template: this.inactiveEnFsnSection } },
      { field: 'inactiveFrPtSection', hide: this.selectedLanguage !== this.languageOptions[2], tooltipField: 'inactiveFrPtSection', headerName: 'Inactive ' + this.selectedLanguage, cellClass: 'adjudicate-column-inactiveFrPtSection', flex: 1, minWidth: 220,maxWidth:220, cellRenderer: 'templateRenderer', cellRendererParams: { template: this.inactiveFrPtSection } },
      { field: 'inactiveNlPtSection', hide: this.selectedLanguage !== this.languageOptions[3], tooltipField: 'inactiveNlPtSection', headerName: 'Inactive ' + this.selectedLanguage, cellClass: 'adjudicate-column-inactiveNlPtSection', flex: 1, minWidth: 220,maxWidth:220, cellRenderer: 'templateRenderer', cellRendererParams: { template: this.inactiveNlPtSection } },
      { field: 'reason', tooltipField: 'reason', headerName: 'Association', cellClass: 'adjudicate-column-reason', flex: 1, minWidth: 220,maxWidth:220, cellRenderer: 'templateRenderer', cellRendererParams: { template: this.reasonSection } },
      { field: 'replacementCode', tooltipField: 'replacementCode', headerName: '', cellClass: 'adjudicate-column-replacementCode', flex: 1, minWidth: 60, width: 60,maxWidth:70, cellRenderer: 'templateRenderer', floatingFilter: false, cellRendererParams: { template: this.replacementCodeSection } },
      { field: 'replacementId', tooltipField: 'replacementId', headerName: 'Replacement ID', cellClass: 'adjudicate-column-replacementId', flex: 1, minWidth: 150,maxWidth:160,  cellRenderer: 'templateRenderer', cellRendererParams: { template: this.replacementIdSection } },
      { field: 'replacementEnPtSection', hide: this.selectedLanguage !== this.languageOptions[0], tooltipField: 'replacementEnPtSection', headerName: 'Replacement ' + this.selectedLanguage, cellClass: 'adjudicate-column-replacementEnPtSection', flex: 1, minWidth: 220,maxWidth:220, cellRenderer: 'templateRenderer', cellRendererParams: { template: this.replacementEnPtSection } },
      { field: 'replacementEnFsnSection', hide: this.selectedLanguage !== this.languageOptions[1], tooltipField: 'replacementEnFsnSection', headerName: 'Replacement ' + this.selectedLanguage, cellClass: 'adjudicate-column-replacementEnFsnSection', flex: 1, minWidth: 220,maxWidth:220, cellRenderer: 'templateRenderer', cellRendererParams: { template: this.replacementEnFsnSection }},
      { field: 'replacementFrPtSection', hide: this.selectedLanguage !== this.languageOptions[2], tooltipField: 'replacementFrPtSection', headerName: 'Replacement ' + this.selectedLanguage, cellClass: 'adjudicate-column-replacementFrPtSection', flex: 1, minWidth: 220,maxWidth:220, cellRenderer: 'templateRenderer', cellRendererParams: { template: this.replacementFrPtSection }},
      { field: 'replacementNlPtSection', hide: this.selectedLanguage !== this.languageOptions[3], tooltipField: 'replacementNlPtSection', headerName: 'Replacement ' + this.selectedLanguage, cellClass: 'adjudicate-column-replacementNlPtSection', flex: 1, minWidth: 220,maxWidth:220, cellRenderer: 'templateRenderer', cellRendererParams: { template: this.replacementNlPtSection }},      
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

  addRemoveConcept(params: any, isReplacement: boolean, changeMethod: string): void {
  this.changeMethod = changeMethod;
  if (isReplacement) {
    this.conceptForAddRemove = params.concept;
  } else {
    this.conceptForAddRemove = params.concept?.replacementConcecpts[0];
  }
}

changeLockedStatus(lock: boolean) {

  this.isLocked = lock;
  this.refsetDetails.toggleLoadingSpinner(false);
  UiUtility.toggleLockedSections(lock);
}

processChangedMemberEffects = () => {

  this.changeLockedStatus(false);
  this.refsetDetails.showLoadingSpinner = true;

  this.onGridReady(this.originalGridParams);
  this.refsetDetails.showLoadingSpinner = false;
}
  
  hideIncludedReplacements(checked: boolean): void {
    this.hideReplacements = checked;
    this.onGridReady(this.originalGridParams);
  }

  formatReason(reason: string): string {
    return reason?.split('_').join(' ');
  }

  transformDescriptions(descriptions: any) {
    if (descriptions) {
      const getStringifiedJSON = descriptions.split('[')[1].split(']')[0];
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
          if (x[x.length - 1] !== '}' && x[x.length - 2] !== '"') {
            x = x + '"}';
          }
          return JSON.parse(x);
        });
        return formattedObjectArray.filter((x) => {
          return x.languageName === this.selectedLanguage;
        });
      }
    }
  }

  transformReplacementDescriptions(descriptions: any) {
    if (descriptions) {
      const getStringifiedJSON = descriptions.split('[')[1].split(']')[0];
      if (getStringifiedJSON) {
        const formattedObjectArray = getStringifiedJSON.slice(1).split('{"active"').map((x) => {
          if (x[x.length - 1] === ',') {
            const modifiedString = x.slice(0, -1);
            x = modifiedString;
          }
          if (!x.includes('"active"')) {
            x = '{"active"' + x;
          } else if (!x.includes('{"active"') && x.includes('"active"')) {
            x = '{' + x;
          }
          if (x[x.length - 1] !== '}' && x[x.length - 2] !== '"') {
            x = x + '"}';
          }
          return JSON.parse(x);
        });
        return formattedObjectArray.filter((x) => {
          return x.lang === this.getLanguageAndType()[0] && x.type === this.getLanguageAndType()[1];
        });
      }
    }
  }

  getLanguageAndType(): string[] {
    const language = this.selectedLanguage.split(' ')[0].toLowerCase();
    const type = this.selectedLanguage.split(' ')[1].split('(')[1].split(')')[0];

    return [language, type];
  }

  ngOnChanges(changes: SimpleChanges): void {
  }

  openAdjudicateUpgradeModal(adjudicateUpgradeDialog: NgbModal) {
    this.modalService.dismissAll();
    this.modalService.open(adjudicateUpgradeDialog, {
      backdrop: 'static',
      keyboard: false,
      windowClass: 'adjudicate-upgrade-modal',
      size: 'xl'
    });
  }

  changeLanguage($event: any) {
        this.onGridReady(this.originalGridParams);
  }

  onGridReady = (gridReadyParams) => {

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

          this.refsetService.getUpgradeData(this.selectedVersion ? this.selectedVersion : this.route.snapshot.queryParamMap.get('selectedVersion'), restParams).subscribe(results => {

            results.items = results.items.filter((x) => {
              if (this.hideReplacements) {
                return !x.replacementConcecpts[0].existingMember && x.active === false;
              }
              return x.active === false;
            });

            results.items.sort(function(a, b) {
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

            this.numOfResults = results.items.length;
            console.log(results.items)

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
        'Inactive Concept ID': inactiveConcepts[i].code,
        'Inactive Concept': this.upgradeModalComponent.transformDescriptions(inactiveConcepts[i].descriptions).term.replaceAll(',', '/'),
        'Reason': inactiveConcepts[i].replacementConcecpts ? inactiveConcepts[i].replacementConcecpts[0].reason : '',
        'Suggested Replacement Concept ID': inactiveConcepts[i].replacementConcecpts ? inactiveConcepts[i].replacementConcecpts[0].code : '',
        'Suggested Replacement Concept': this.upgradeModalComponent.transformReplacementDescriptions(inactiveConcepts[i].replacementConcecpts ? inactiveConcepts[i].replacementConcecpts[0].descriptions : '').term.replaceAll(',', '/')
      });
    }

    UiUtility.createInactiveChangeReport(this.refsetData.refsetId, data);

  }

  getFinishedChangeReport(shouldDownload = true): void {

    // Get old members from inactive concepts
    let memberItems = this.membersInCommon?.items;
    let inactiveConcepts = memberItems.filter((items: any) => {
      return items?.replaced === true;
    });
    let oldMembers = [];
    for (let i = 0; i < inactiveConcepts.length; i++) {
      oldMembers.push({
        'Old Member ID': inactiveConcepts[i].replacementConcecpts ? inactiveConcepts[i].replacementConcecpts[0].code : '',
        'Old Member Concept': this.upgradeModalComponent.transformReplacementDescriptions(inactiveConcepts[i].replacementConcecpts ? inactiveConcepts[i].replacementConcecpts[0].descriptions : '').term.replaceAll(',', '/')
      });
    }

    // Get new members from inactive concepts
    memberItems = this.membersInCommon?.items;
    inactiveConcepts = memberItems.filter((items: any) => {
      return items?.replaced === true;
    });
    let newMembers = [];
    for (let i = 0; i < inactiveConcepts.length; i++) {
      newMembers.push({
        'New Member ID': inactiveConcepts[i].code,
        'New Member Concept': this.upgradeModalComponent.transformDescriptions(inactiveConcepts[i].descriptions).term.replaceAll(',', '/')
      });
    }

    // Get manual replacements from inactive concepts
    memberItems = this.membersInCommon?.items;
    inactiveConcepts = memberItems.filter((items: any) => {
      return items?.replacementConcecpts[0].added === true;
    });
    let manualReplacement = [];
    for (let i = 0; i < inactiveConcepts.length; i++) {
      manualReplacement.push({
        'Manual Replacement ID': inactiveConcepts[i].replacementConcecpts ? inactiveConcepts[i].replacementConcecpts[0].code : '',
        'Manual Replacement Concept': this.upgradeModalComponent.transformReplacementDescriptions(inactiveConcepts[i].replacementConcecpts ? inactiveConcepts[i].replacementConcecpts[0].descriptions : '').term.replaceAll(',', '/')
      });
    }

    // Get members in common
    const membersInCommonItems = this.membersOfRefset;
    const commonConcepts = membersInCommonItems.filter((x) => {
      return !memberItems.includes(x.id);
    });
    console.log(commonConcepts)
    let membersInCommon = [];
    for (let i = 0; i < commonConcepts.length; i++) {
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
    // if (shouldDownload) {
    //   UiUtility.createFinishedChangeReport(this.refsetData.refsetId, changeReportObject);
    // } else {
    //   if (localStorage.getItem('finishedChangeReportData')) {
    //     localStorage.removeItem('finishedChangeReportData');
    //   }
    //   localStorage.setItem('finishedChangeReportData', JSON.stringify(changeReportObject));
    // }
    UiUtility.createFinishedChangeReport(this.refsetData.refsetId, changeReportObject);

  }
}
