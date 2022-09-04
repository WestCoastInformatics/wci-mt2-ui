import { AfterViewInit, ChangeDetectorRef, Component, Input, OnChanges, OnInit, QueryList, SimpleChanges, ViewChild, ViewChildren } from '@angular/core';
import { MatButton } from '@angular/material/button';
import { AgGridAngular } from 'ag-grid-angular';
import { PaginationService } from 'src/app/services/pagination.service';

@Component({
    selector: 'app-pagination',
    templateUrl: './pagination.component.html'
})

// AG Grid page numbers are 0 based, all other page variables here are 1 based
export class PaginationComponent implements OnChanges, AfterViewInit, OnInit {

    @Input() pageSize: number = 0;
    @Input() gridOptions;
    @Input() pageSizeOptions: Array<number> = [10, 25, 50];
    @Input() totalKnown = false;
    @Input() manualStateRefresh = false;
    @Input() showAll: boolean;

    currentPage: number = 1;
    paginationPages: any = {};
    showTotal = true;
    startRecord: number;
    endRecord: number;
    displayedPages: number = 0;
    displayedResults: number = 0;
    activeGridOptions: any;

    @ViewChild('paginationFirstPage') firstPageButton: MatButton;
    @ViewChild('paginationPreviousPage') previousPageButton: MatButton;
    @ViewChild('paginationNextPage') nextPageButton: MatButton;
    @ViewChild('paginationLastPage') lastPageButton: MatButton;
    @ViewChildren('paginationPageNumber') pageNumberButtons: QueryList<MatButton>;

    constructor(private pagerService: PaginationService, private changeDetectorRef: ChangeDetectorRef) { }

    getCurrentPage(): number {

        if (this.activeGridOptions?.api) {

            this.displayedPages = this.activeGridOptions.api.paginationGetTotalPages();
            this.displayedResults = this.activeGridOptions.api.getDisplayedRowCount();
        }

        this.currentPage = this.activeGridOptions?.api ? this.activeGridOptions.api.paginationGetCurrentPage() + 1 : 1;
        this.startRecord = (this.currentPage * this.pageSize) - (this.pageSize - 1);
        this.endRecord = this.currentPage * this.pageSize;
        this.endRecord = this.displayedResults < this.endRecord ? this.displayedResults : this.endRecord;

        return this.currentPage;
    }

    ngOnInit(): void {
        this.activeGridOptions = this.gridOptions;
    }

    ngAfterViewInit() {
    }

    ngOnChanges(changes: SimpleChanges) {

        for (const propertyName in changes) {

            if (propertyName === 'gridOptions') {

                if (!this.activeGridOptions && changes.gridOptions.previousValue == null && changes.gridOptions.currentValue) {

                    this.activeGridOptions = changes.gridOptions.currentValue;

                    if (this.activeGridOptions.api) {

                        this.activeGridOptions.api.eventService.addEventListener('filterChanged', (event) => {

                            this.activeGridOptions?.api.paginationGoToPage(0);
                            this.changeState();
                        });
                    }
                }

                break;
            }
        }

        this.changeState();
    }

    changeState(currentPage: number = this.getCurrentPage()) {

        this.paginationPages = this.displayedPages ? this.pagerService.getPager(this.displayedPages, currentPage, this.totalKnown) : {};
        this.checkButtons();
    }

    checkButtons() {

        if (this.firstPageButton == undefined) {
            return;
        }

        this.currentPage = this.getCurrentPage();

        if (this.currentPage === 1) {

            this.firstPageButton.disabled = true;
            this.previousPageButton.disabled = true;
        } else {

            this.firstPageButton.disabled = false;
            this.previousPageButton.disabled = false;
        }

        this.nextPageButton.disabled = this.currentPage === this.paginationPages.totalPages;

        this.lastPageButton.disabled = this.currentPage === this.paginationPages.totalPages || !this.totalKnown;

        for (const pageNumberButton of this.pageNumberButtons.toArray()) {

            if (pageNumberButton._getHostElement().innerText == this.currentPage) {
                pageNumberButton.color = 'primary';
            } else {
                pageNumberButton.color = null;
            }
        }
    }

    goToPage(index: number) {

        this.activeGridOptions?.api.paginationGoToPage(index - 1);
        this.changeState(index);
    }

    goToNext(index: number) {

        this.activeGridOptions.api.paginationGoToNextPage();
        this.changeState();
    }

    goToPrevious(index: number) {

        this.activeGridOptions.api.paginationGoToPreviousPage();
        this.paginationPages = this.pagerService.getPager(this.displayedPages, this.getCurrentPage(), this.totalKnown);
        this.changeState();
    }

    setPageSize(pageSize: number, showAll = false) {

        this.showAll = showAll;

        if (this.activeGridOptions) {

            if (this.activeGridOptions.api.gridCore.rowModel.cacheParams) {
                this.activeGridOptions.api.gridCore.rowModel.cacheParams.blockSize = pageSize;
                this.activeGridOptions.api.gridOptionsWrapper.setProperty('cacheBlockSize', pageSize);
                this.activeGridOptions.api.paginationSetPageSize(pageSize);
                this.activeGridOptions.api.purgeInfiniteCache();
            } else {
                this.activeGridOptions.api.paginationSetPageSize(pageSize);
                this.displayedPages = this.activeGridOptions.api.paginationGetTotalPages();
            }
            this.activeGridOptions.api.paginationGoToPage(0);
            this.changeState(0);
        }

        this.pageSize = pageSize;
    }
}
