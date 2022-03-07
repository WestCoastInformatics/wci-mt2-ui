import { AfterViewInit, ChangeDetectorRef, Component, Input, OnChanges, OnInit, SimpleChanges, TemplateRef, ViewChild } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { NgbModal } from '@ng-bootstrap/ng-bootstrap';
import { RefsetDetails } from 'src/app/pages/refset-details';
import { RefsetService } from 'src/app/services/rest/refset.service';
import { UiUtility } from 'src/app/utilities/ui.utility';
import { CategoryFilterComponent } from '../categoryFilter/category-filter.component';
import { TemplateRenderer } from '../cellRenderers/template.renderer';
import { PaginationComponent } from '../pagination/pagination.component';

@Component({
  selector: 'adjudicate-upgrade-modal',
  templateUrl: './adjudicate-upgrade-modal.component.html'
})
export class AdjudicateUpgradeModalComponent implements OnInit, AfterViewInit, OnChanges {

  @Input()
  refsetData: any;
  @Input()
  inactiveConcepts: any;
  @Input()
  membersInCommon: any;
  @Input()
  selectedVersion: any
  numOfResults: any;
  numOfMembers: any;
  selectedLanguage = 'EN (PT)';
  languageOptions = ['EN (PT)', 'EN (FSN)', 'FR (PT)', 'NL (PT)'];
  hideReplacements = false;
  refsetGridLastFilter: string = '';
  refsetGridLastSort: string = '';
  @ViewChild('adjudicatePaging') paginationComponent: PaginationComponent;
  @ViewChild('adjudicateInactiveId') inactiveIdSection: TemplateRef<any>;
  @ViewChild('adjudicateInactiveEnPtSection') inactiveEnPtSection: TemplateRef<any>;
  @ViewChild('adjudicateInactiveEnFsnSection') inactiveEnFsnSection: TemplateRef<any>;
  @ViewChild('adjudicateInactiveFrPtSection') inactiveFrPtSection: TemplateRef<any>;
  @ViewChild('adjudicateInactiveNlPtSection') inactiveNlPtSection: TemplateRef<any>;
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
    pageSize: 100,
    pageSizeOptions: [5, 10, 25, 50],
    totalKnown: false,
    totalRows: null,
    manualStateRefresh: new Boolean(true)
};
  originalGridParams: any;
  refsetGridApi: any;
  refsetGridColumnApi: any;

  constructor(private readonly modalService: NgbModal,
    private readonly refsetService: RefsetService,
    readonly refsetDetails: RefsetDetails,
    private readonly changeDetection: ChangeDetectorRef,
    private readonly route: ActivatedRoute) { }

  ngOnInit(): void {
  }

  ngAfterViewInit() {

    this.columnDefs = [
      { field: 'inactiveId', tooltipField: 'inactiveId', headerName: 'Inactive ID', cellClass: 'adjudicate-column-inactiveId', cellRenderer: 'templateRenderer', cellRendererParams: { template: this.inactiveIdSection }, flex: 1, minWidth: 155},
      { field: 'inactiveEnPtSection', hide: this.selectedLanguage !== this.languageOptions[0], tooltipField: 'inactiveEnPtSection', headerName: 'Inactive ' + this.selectedLanguage, cellClass: 'adjudicate-column-inactiveEnPtSection', flex: 1, minWidth: 220, cellRenderer: 'templateRenderer', cellRendererParams: { template: this.inactiveEnPtSection } },
      { field: 'inactiveEnFsnSection', hide: this.selectedLanguage !== this.languageOptions[1], tooltipField: 'inactiveEnFsnSection', headerName: 'Inactive ' + this.selectedLanguage, cellClass: 'adjudicate-column-inactiveEnFsnSection', flex: 1, minWidth: 220, cellRenderer: 'templateRenderer', cellRendererParams: { template: this.inactiveEnFsnSection } },
      { field: 'inactiveFrPtSection', hide: this.selectedLanguage !== this.languageOptions[2], tooltipField: 'inactiveFrPtSection', headerName: 'Inactive ' + this.selectedLanguage, cellClass: 'adjudicate-column-inactiveFrPtSection', flex: 1, minWidth: 220, cellRenderer: 'templateRenderer', cellRendererParams: { template: this.inactiveFrPtSection } },
      { field: 'inactiveNlPtSection', hide: this.selectedLanguage !== this.languageOptions[3], tooltipField: 'inactiveNlPtSection', headerName: 'Inactive ' + this.selectedLanguage, cellClass: 'adjudicate-column-inactiveNlPtSection', flex: 1, minWidth: 220, cellRenderer: 'templateRenderer', cellRendererParams: { template: this.inactiveNlPtSection } },
      { field: 'replacementId', tooltipField: 'replacementId', headerName: 'Replacement ID', cellClass: 'adjudicate-column-replacementId', flex: 1, minWidth: 220, cellRenderer: 'templateRenderer', cellRendererParams: { template: this.replacementIdSection } },
      { field: 'replacementEnPtSection', hide: this.selectedLanguage !== this.languageOptions[0], tooltipField: 'replacementEnPtSection', headerName: 'Replacement ' + this.selectedLanguage, cellClass: 'adjudicate-column-replacementEnPtSection', flex: 1, minWidth: 220, cellRenderer: 'templateRenderer', cellRendererParams: { template: this.replacementEnPtSection } },
      { field: 'replacementEnFsnSection', hide: this.selectedLanguage !== this.languageOptions[1], tooltipField: 'replacementEnFsnSection', headerName: 'Replacement ' + this.selectedLanguage, cellClass: 'adjudicate-column-replacementEnFsnSection', flex: 1, minWidth: 220, cellRenderer: 'templateRenderer', cellRendererParams: { template: this.replacementEnFsnSection }},
      { field: 'replacementFrPtSection', hide: this.selectedLanguage !== this.languageOptions[2], tooltipField: 'replacementFrPtSection', headerName: 'Replacement ' + this.selectedLanguage, cellClass: 'adjudicate-column-replacementFrPtSection', flex: 1, minWidth: 220, cellRenderer: 'templateRenderer', cellRendererParams: { template: this.replacementFrPtSection }},
      { field: 'replacementNlPtSection', hide: this.selectedLanguage !== this.languageOptions[3], tooltipField: 'replacementNlPtSection', headerName: 'Replacement ' + this.selectedLanguage, cellClass: 'adjudicate-column-replacementNlPtSection', flex: 1, minWidth: 220, cellRenderer: 'templateRenderer', cellRendererParams: { template: this.replacementNlPtSection }},      
      { field: 'reason', tooltipField: 'reason', headerName: 'Reason', cellClass: 'adjudicate-column-reason', flex: 1, minWidth: 220, cellRenderer: 'templateRenderer', cellRendererParams: { template: this.reasonSection } },
    ];

    this.refsetGridOptions = {
        context: { componentParent: this },
        pagination: true,
        suppressColumnVirtualisation: true, // need this so you can access rows and cells that might not be currently visible, including if the grid is hidden
        suppressPaginationPanel: true,
        paginationPageSize: this.refsetGridPaging.pageSize,
        cacheBlockSize: this.refsetGridPaging.pageSize,
        maxBlocksInCache: 1,
        rowModelType: 'infinite',
        enableCellTextSelection: true,
        rowSelection: 'single',
        onGridReady: this.onGridReady,
        frameworkComponents: {
            'templateRenderer': TemplateRenderer,
            'categoryFilterComponent': CategoryFilterComponent
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
        rowClassRules: {
            'refset_tool_grid_inactive_row': function (params) {

                var inactivatedRow = false;

                if (params.data) {
                    inactivatedRow = params.data.active == false;
                }

                return inactivatedRow;
            }
        }
    };
}

  // hideIncludedReplacements(): void {
  //   console.log(this.hideReplacements)
  //   if (this.hideReplacements) {
  //     this.refsetGridApi.purgeInfiniteCache();
  //     this.refsetGridOptions.getRowStyle = function (params) {
  //       console.log(params.data)
  //       return { 'display': 'block' };
  //     };
  //     this.onGridReady(this.originalGridParams); 
  //   } else {
  //     this.refsetGridApi.purgeInfiniteCache();
  //     this.refsetGridOptions.getRowStyle = function (params) {
  //       console.log(params.data)
  //       if (params.data?.replacementConcecpts[0].reason === 'SAME_AS') {
  //         return { 'display': 'none' };
  //       }
  //       return { 'display': 'block' };
  //     };
  //     this.onGridReady(this.originalGridParams);
  //   }

  // }

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

  changeLanguage(language: string) {
    this.selectedLanguage = language;
    this.changeDetection.detectChanges();
  }

  onGridReady = (gridReadyParams) => {

    this.originalGridParams = gridReadyParams;
    this.refsetGridApi = gridReadyParams.api;
    this.refsetGridColumnApi = gridReadyParams.columnApi;

    let dataSource = {
        rowCount: null,
        getRows: (rowParams) => {

            this.refsetGridApi.showLoadingOverlay();

            let pageNumber = rowParams.endRow / this.refsetGridApi.paginationGetPageSize();
            let query = UiUtility.formatFilterData(rowParams.filterModel);
            let sort = UiUtility.formatSortData(rowParams.sortModel);

            let newFilterString = query;
            let newSortString = JSON.stringify(sort);

            // if the filters or sort have changed then move to the first page
            if (newFilterString !== this.refsetGridLastFilter || newSortString !== this.refsetGridLastSort) {

                pageNumber = 1;
                this.refsetGridApi?.api?.paginationGoToPage(0);
            }

            // if the filters have changed then reset the total row variables
            if (newFilterString !== this.refsetGridLastFilter) {

                this.refsetGridPaging.totalRows = null;
                this.refsetGridPaging.totalKnown = false;
            }

            this.refsetGridLastFilter = newFilterString;
            this.refsetGridLastSort = newSortString;

            query = query.replace(/\//g, '%2F');


            // change boolean below to test locally with active concepts
            // this.membersInCommon.items = this.membersInCommon.items.filter((x) => {
            //   return x.active === true;
            // });
          
          // console.log(this.membersInCommon.items)

          //       this.numOfResults = this.membersInCommon.total;
          //       if (this.membersInCommon.items.length == 0 && pageNumber > 1) {

          //           this.refsetGridPaging.totalRows = (this.refsetGridApi.paginationGetPageSize() * (pageNumber - 1));
          //           this.refsetGridPaging.totalKnown = true;
          //           this.paginationComponent.goToPage(pageNumber - 1);
          //           return;
          //       }

          //       let data = this.membersInCommon.items;
          //       this.refsetData = data;

          //       if (data?.length > 0) {

          //           this.refsetGridApi.hideOverlay();
          //           let currentRowCount = null;
          //           let lastRow = -1;

          //           if (this.membersInCommon.totalKnown || data.length < this.refsetGridApi.paginationGetPageSize() || this.refsetGridPaging.totalKnown) {

          //               if (this.membersInCommon.totalKnown) {

          //                   lastRow = this.membersInCommon.total;

          //               } else if (this.refsetGridPaging.totalKnown) {

          //                   lastRow = this.refsetGridPaging.totalRows;
          //               } else {

          //                   currentRowCount = data.length + ((pageNumber - 1) * this.refsetGridApi.paginationGetPageSize());
          //                   lastRow = currentRowCount;
          //               }

          //               this.refsetGridPaging.totalRows = lastRow;
          //               this.refsetGridPaging.totalKnown = true;

          //           } else {
          //               currentRowCount = data.length + ((pageNumber - 1) * this.refsetGridApi.paginationGetPageSize());
          //           }

          //           rowParams.successCallback(data, lastRow);
          //       } else {

          //           this.refsetGridApi.showNoRowsOverlay();
          //           rowParams.successCallback([], 0);
          //       }

          let restParams: any = {
            displayType: "list",
            limit: this.refsetGridApi.paginationGetPageSize(),
            offset: pageNumber - 1
        };

          this.refsetService.getUpgradeData(this.selectedVersion ? this.selectedVersion : this.route.snapshot.queryParamMap.get('selectedVersion'), restParams).subscribe(results => {

            results.items = results.items.filter((x) => {
              return x.active === false;
            });

            this.numOfResults = results.items.length;
            console.log(results.items)
            if (results.items.length == 0 && pageNumber > 1) {

                this.refsetGridPaging.totalRows = (this.refsetGridApi.paginationGetPageSize() * (pageNumber - 1));
                this.refsetGridPaging.totalKnown = true;
                this.paginationComponent.goToPage(pageNumber - 1);
                return;
            }

            let data = results.items;
            this.refsetData = data;

            if (data?.length > 0) {

                this.refsetGridApi.hideOverlay();
                let currentRowCount = null;
                let lastRow = -1;

                if (results.totalKnown || data.length < this.refsetGridApi.paginationGetPageSize() || this.refsetGridPaging.totalKnown) {

                    if (results.totalKnown) {

                        lastRow = results.items.length;

                    } else if (this.refsetGridPaging.totalKnown) {

                        lastRow = this.refsetGridPaging.totalRows;
                    } else {

                        currentRowCount = data.length + ((pageNumber - 1) * this.refsetGridApi.paginationGetPageSize());
                        lastRow = currentRowCount;
                    }

                    this.refsetGridPaging.totalRows = lastRow;
                    this.refsetGridPaging.totalKnown = true;

                } else {
                    currentRowCount = data.length + ((pageNumber - 1) * this.refsetGridApi.paginationGetPageSize());
                }

                rowParams.successCallback(data, lastRow);
            } else {

                this.refsetGridApi.showNoRowsOverlay();
                rowParams.successCallback([], 0);
            }

            this.refsetGridPaging.manualStateRefresh = new Boolean(true);
        },
            error => {

                this.refsetGridApi.showNoRowsOverlay();
                rowParams.successCallback([], 0);
            });
        }
    };

    gridReadyParams.api.setDatasource(dataSource);


    // set placeholders on the grid floating filter fields
    // Array.from(document.querySelectorAll('.ag-floating-filter-full-body .ag-input-field-input')).forEach((obj: any) => {

    //     if (obj.attributes['disabled']) { // skip columns with disabled filter
    //         return;
    //     }

    //     let label = obj.getAttribute('aria-label');
    //     let value = label.substring(0, label.indexOf('Filter Input')) + '...';
    //     obj.setAttribute('placeholder', value);
    // });


}
}
