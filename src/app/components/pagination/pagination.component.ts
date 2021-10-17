import { ApplicationRef, ChangeDetectorRef, Component, Input, OnChanges, QueryList, SimpleChanges, ViewChild, ViewChildren } from '@angular/core';
import { MatButton } from '@angular/material/button';
import { AgGridAngular } from 'ag-grid-angular';
import { PaginationService } from 'src/app/services/pagination.service';

@Component({
    selector: 'app-pagination',
    templateUrl: './pagination.component.html'
})

// AG Grid page numbers are 0 based, all other page variables here are 1 based
export class PaginationComponent implements OnChanges {

    @Input() pageSize: number = 0;
    @Input() gridOptions;
    @Input() numberOfPages: number = 0;
    @Input() pageSizeOptions: Array<number> = [10, 25, 50];
    @Input() totalKnown = false;
    @Input() manualStateRefresh = false;
    @Input() numOfResults: number;
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
    

    constructor(
        private pagerService: PaginationService,
        private changeDetectorRef: ChangeDetectorRef
        ) {}

    getCurrentPage(): number {

        this.currentPage = this.gridOptions?.api ? this.gridOptions.api.paginationGetCurrentPage() + 1 : 1;
        this.startRecord = (this.currentPage * this.pageSize) - (this.pageSize - 1);
        this.endRecord = this.currentPage * this.pageSize;
        return this.currentPage;
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

        this.changeState();
    }

    changeState(currentPage: number = this.getCurrentPage()) { 

        this.paginationPages = this.numberOfPages ? this.pagerService.getPager(this.numberOfPages, currentPage, this.totalKnown) : {};
        this.checkButtons();
    }

    checkButtons() {

        if (this.firstPageButton == undefined){
            return;
        }

        console.log("**** checkButtons");
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

        this.gridOptions.api.paginationGoToPage(index - 1);

        if (!this.manualStateRefresh){
            this.changeState(index);
        }
    }

    goToNext() {

        this.gridOptions.api.paginationGoToNextPage();
        
        if (!this.manualStateRefresh){
            this.changeState();
        }
    }

    goToPrevious() {

        this.gridOptions.api.paginationGoToPreviousPage();
        this.paginationPages = this.pagerService.getPager(this.numberOfPages, this.getCurrentPage(), this.totalKnown);
        
        if (!this.manualStateRefresh){
            this.changeState();
        }
    }

    setPageSize(pageSize: number) {

        this.gridOptions.api.gridCore.rowModel.cacheParams.blockSize = pageSize;
        this.gridOptions.api.gridOptionsWrapper.setProperty('cacheBlockSize', pageSize);
        this.gridOptions.api.paginationSetPageSize(pageSize);
        this.gridOptions.api.purgeInfiniteCache();
        this.gridOptions.api.paginationGoToPage(0);

        this.pageSize = pageSize;
    }

}