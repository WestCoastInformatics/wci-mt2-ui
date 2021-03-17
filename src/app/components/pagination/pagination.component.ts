import { ApplicationRef, ChangeDetectorRef, Component, Input, OnChanges, SimpleChanges } from '@angular/core';
import { AgGridAngular } from 'ag-grid-angular';
import { PaginationService } from 'src/app/services/pagination.service';

@Component({
    selector: 'app-pagination',
    templateUrl: './pagination.component.html'
})

export class PaginationComponent implements OnChanges {

    @Input() pageSize: number = 0;
    @Input() gridOptions;
    @Input() numberOfPages: number = 0;
    @Input() pageSizeOptions: Array<number> = [10, 25, 50];
    paginationPages: any = {};

    constructor(
        private pagerService: PaginationService,
        ) {
     }

    getCurrentPage(): number {
        return this.gridOptions ? this.gridOptions.api.paginationGetCurrentPage() : 0;
    }

    ngOnChanges(changes: SimpleChanges) {

        for (const propertyName in changes) {

            if (propertyName === 'numberOfPages' || propertyName === 'pageSize') {

                this.paginationPages = this.numberOfPages ? this.pagerService.getPager(this.numberOfPages, 1) : {};
                this.gridOptions?.api?.paginationGoToPage(0);
            }
        }
    }

    goToPage(index: number) {

        this.gridOptions.api.paginationGoToPage(index);
        this.paginationPages = this.pagerService.getPager(this.numberOfPages, index + 1);
    }

    goToNext() {

        this.gridOptions.api.paginationGoToNextPage();
        this.paginationPages = this.pagerService.getPager(this.numberOfPages, this.getCurrentPage());
    }

    goToPrevious() {

        this.gridOptions.api.paginationGoToPreviousPage();
        this.paginationPages = this.pagerService.getPager(this.numberOfPages, this.getCurrentPage());
    }

    setPageSize(pageSize: number) {

        this.gridOptions.api.gridCore.rowModel.cacheParams.blockSize = pageSize;
        this.gridOptions.api.gridOptionsWrapper.setProperty('cacheBlockSize', pageSize);
        this.gridOptions.api.paginationSetPageSize(pageSize);
        this.gridOptions.api.purgeInfiniteCache();

        this.pageSize = pageSize;
    }

}