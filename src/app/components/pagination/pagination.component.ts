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
    @Input() numberOfPages: number = 0;
    @Input() pageSizeOptions: Array<number> = [10, 25, 50];
    @Input() totalKnown = false;
    @Input() manualStateRefresh = false;
    @Input() numOfResults: number;
    @Input() isDetailPage = false;
    @Input() isDirectoryPage = false;
    @Input() isProjectsPage = false;
    @Input() refsetId;
    @Input() isSelectedProject;
    currentPage: number = 1;
    paginationPages: any = {};
    showTotal = true;
    startRecord: number;
    endRecord: number;

    @ViewChild('paginationFirstPage') firstPageButton: MatButton;
    @ViewChild('paginationPreviousPage') previousPageButton: MatButton;
    @ViewChild('paginationNextPage') nextPageButton: MatButton;
    @ViewChild('paginationLastPage') lastPageButton: MatButton;
    @ViewChildren('paginationPageNumber') pageNumberButtons: QueryList<MatButton>;
    activeGridOptions: any;
    @Input()
    showAll: boolean;
    

    constructor(
        private pagerService: PaginationService,
        private changeDetectorRef: ChangeDetectorRef
        ) {}

    getCurrentPage(): number {

        this.currentPage = this.activeGridOptions?.api ? this.activeGridOptions.api.paginationGetCurrentPage() + 1 : 1;
        this.startRecord = (this.currentPage * this.pageSize) - (this.pageSize - 1);
        this.endRecord = this.currentPage * this.pageSize;
        this.endRecord = this.numOfResults < this.endRecord ? this.numOfResults : this.endRecord;
        return this.currentPage;
    }

    ngOnInit(): void {
        this.activeGridOptions = this.gridOptions;
    }

    ngAfterViewInit() {

        // subsrcribe to changes to the page number buttons so the current page button can be colored appropriately
        // this.pageNumberButtons.changes.subscribe(changedItems => { 

        //     let currentPage = this.getCurrentPage();

        //     changedItems.toArray().forEach(pageNumberButton => { 

        //         if (pageNumberButton._getHostElement().innerText == currentPage) {
        //             pageNumberButton.color = 'primary';
        //         } else {
        //             pageNumberButton.color = null;
        //         }
        //     }) 
        // });
    }

    ngOnChanges(changes: SimpleChanges) {

        // for (const propertyName in changes) {

        //     if (propertyName === 'totalKnown') {

        //         if (this.totalKnown){
        //             this.showTotal = true;
        //         } else {
        //             this.showTotal = false;
        //         }

        //         break;
        //     }
        // }
        this.activeGridOptions = this.activeGridOptions ? this.activeGridOptions : changes.gridOptions.currentValue;
        this.changeState();
        // if (changes.numberOfPages && this.numOfResults > 0) {
        //     this.getStorageItems();
        // }
        this.changeDetectorRef.detectChanges();
    }

    changeState(currentPage: number = this.getCurrentPage()) { 

        this.paginationPages = this.numberOfPages ? this.pagerService.getPager(this.numberOfPages, currentPage, this.totalKnown) : {};
        this.checkButtons();
    }

    checkButtons() {

        if (this.firstPageButton == undefined){
            return;
        }

        this.currentPage = this.getCurrentPage();

        if (this.currentPage === 1){

            this.firstPageButton.disabled = true;
            this.previousPageButton.disabled = true;
        } else {

            this.firstPageButton.disabled = false;
            this.previousPageButton.disabled = false;
        }

        if (this.currentPage === this.paginationPages.totalPages){
            this.nextPageButton.disabled = true;
        } else {
            this.nextPageButton.disabled = false;
        }
        
        if (this.currentPage === this.paginationPages.totalPages || !this.totalKnown){
            this.lastPageButton.disabled = true;
        } else {
            this.lastPageButton.disabled = false;
        }

        for (let pageNumberButton of this.pageNumberButtons.toArray()) {

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
        this.paginationPages = this.pagerService.getPager(this.numberOfPages, this.getCurrentPage(), this.totalKnown);
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
                this.activeGridOptions.api.paginationGoToPage(0);
            } else {
                this.activeGridOptions.api.paginationSetPageSize(pageSize);
                this.activeGridOptions.api.paginationGoToPage(0);
            }
        }

        this.pageSize = pageSize;
    }

}