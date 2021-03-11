import { Component, TemplateRef, ViewChild } from '@angular/core';
import { MatPaginator, PageEvent } from '@angular/material/paginator';
import { DialogService } from '../dialog/services/dialog.service';
import { DialogFactoryService } from '../dialog/services/dialog-factory.service';
import { Observable } from 'rxjs';
import { AgGridAngular } from 'ag-grid-angular';
import { ConceptFeedbackRenderer } from '../components/cellRenderers/concept-feedback.renderer';
import { RefsetService } from '../services/rest/refset.service';
import { Title } from '@angular/platform-browser';


/**
 * @title Tree with nested nodes
 */
@Component({
    selector: 'app-refset-directory',
    templateUrl: './refset-directory.html'
})

export class RefsetDirectory {

    searchInput: String;
    viewOptions= [{value: 'all', display: 'All Refsets'}, {value: 'public', display: 'Public Refsets'}, {value: 'private', display: 'My Private Refsets'}];
    selectedView: String = 'all';
    refsetGridApi: any;
    refsetGridColumnApi: any;  
    columnDefs = [];
    refsetGridOptions: any;
    refsetGridPaging = {
        length: 0,
        pageIndex: 0,
        pageSize: 10,
        pageSizeOptions: [10, 25, 50]
    };
    pageEvent: PageEvent;

    @ViewChild('feedbackSection') feedbackSection: TemplateRef<any>;
    @ViewChild(MatPaginator) paginator: MatPaginator;
    

    constructor(
        private titleService: Title,
        private dialogFactoryService: DialogFactoryService,
        private refsetService: RefsetService
    ) { 

        this.columnDefs = [
            { field: 'id', headerName: 'ID' },
            { field: 'name', headerName: 'Name' },
            { field: 'edition', headerName: 'Edition/Extension' },
            { field: 'organization', headerName: 'Organization/Owner' },
            { field: 'versionStatus', headerName: 'Version Status' },
            { field: 'versionDate', headerName: 'Version Date' },
            { field: 'narrative', headerName: 'Narrative', contentTemplate: 'feedbackSection', cellRenderer: 'conceptFeedbackRenderer', cellRendererParams: { template: 'agFeedbackSection' } }
        ];

        this.refsetGridOptions = {
            context: { componentParent: this },
            pagination: true,
            paginationPageSize: 10,
            cacheBlockSize: 10,
            loadingCellRenderer: 'agLoadingOverlay',
            rowModelType: 'infinite',
            rowSelection: 'single',
            onCellClicked: this.onGridCellClick,
            onGridReady: this.onGridReady,
            frameworkComponents: {
                'conceptFeedbackRenderer': ConceptFeedbackRenderer
            },
            defaultColDef: {
                sortable: true,
                resizable: true,
                filter: true,
                floatingFilter: true,
                floatingFilterComponentParams: { suppressFilterButton: true }
            }
        };
    }

    //***** Framework Functions *****/
    ngOnInit() {

        this.titleService.setTitle('Refset Tool - Refset Directory');
    }

    //***** AG Grid Functions *****/
    onGridReady = (params) => {

        this.refsetGridApi = params.api;
        this.refsetGridColumnApi = params.columnApi;

        this.refsetService.getRefsets().subscribe(results => {

            var dataSource = {
                rowCount: null,
                getRows: (params) => {

                    let data = results.data;

                    //params.api.showLoadingOverlay();

                    var pageNumber = params.endRow / this.refsetGridPaging.pageSize;

                    if (data.length > 0) {

                        //params.api.hideOverlay();
                        var totalRowCount = null;

                        if (results.totalKnown || data.length < this.refsetGridPaging.pageSize) {

                            if (results.totalKnown) {
                                totalRowCount = results.totalResults;
                            } else {
                                totalRowCount = data.length + ((pageNumber - 1) * this.refsetGridPaging.pageSize);
                            }
                        }

                        var dataAfterSortingAndFiltering = this.sortAndFilter(
                            data,
                            params.sortModel,
                            params.filterModel
                        );

                        var rowsThisPage = dataAfterSortingAndFiltering.slice(
                            params.startRow,
                            params.endRow
                        );

                        var lastRow = -1;

                        if (dataAfterSortingAndFiltering.length <= params.endRow) {
                            lastRow = dataAfterSortingAndFiltering.length;
                        }

                        this.refsetGridPaging.length = totalRowCount;
                        params.successCallback(this.pagingIterator(rowsThisPage), lastRow);
                    } else {

                        this.refsetGridApi.api.showNoRowsOverlay();
                        params.successCallback(data, 0);
                    }
                }
            };

            params.api.setDatasource(dataSource);
        });
    }

    private pagingIterator(data: any[]) {

        const end = (this.refsetGridPaging.pageIndex + 1) * this.refsetGridPaging.pageSize;
        const start = this.refsetGridPaging.pageIndex * this.refsetGridPaging.pageSize;
        return data.slice(start, end);
    }

    onGridCellClick = (event) => {

        if (event.column.colId === 'feedback') {


        } else {

            let selectedRows = this.refsetGridApi.getSelectedRows();
            console.log(selectedRows);
            selectedRows.forEach(function (selectedRow, index) {
                console.log('Selected Row: ' + selectedRow.id);
            });
        }
    }

    onConceptGridPageChange(event: PageEvent) {

        console.log("********* event: ", event);
        this.refsetGridPaging.length = event.length;
        this.refsetGridPaging.pageSize = event.pageSize;
        this.refsetGridPaging.pageIndex = event.pageIndex;
    }

    sortAndFilter(allOfTheData, sortModel, filterModel) {
        return this.sortData(sortModel, this.filterData(filterModel, allOfTheData));
    }

    sortData(sortModel, data) {

        var sortPresent = sortModel && sortModel.length > 0;

        if (!sortPresent) {
            return data;
        }

        var resultOfSort = data.slice();

        resultOfSort.sort(function (a, b) {

            for (var k = 0; k < sortModel.length; k++) {

                var sortColModel = sortModel[k];
                var valueA = a[sortColModel.colId];
                var valueB = b[sortColModel.colId];

                if (valueA == valueB) {
                    continue;
                }

                var sortDirection = sortColModel.sort === 'asc' ? 1 : -1;

                if (valueA > valueB) {
                    return sortDirection;
                } else {
                    return sortDirection * -1;
                }
            }

            return 0;
        });

        return resultOfSort;
    }

    filterData(filterModel, data) {

        var filterPresent = filterModel && Object.keys(filterModel).length > 0;

        if (!filterPresent) {
            return data;
        }

        var resultOfFilter = [];

        for (var i = 0; i < data.length; i++) {

            var item = data[i];
            let rowValid = true;

            // loop thru each column with a search term
            for (const column in filterModel) {

                // test each word in the term
                filterModel[column].filter.trim().toLowerCase().split(' ').forEach(word => {

                    // the search word must be present in the data and the row must still be valid
                    if (item[column].toString().toLowerCase().indexOf(word) != -1 && rowValid) {
                        rowValid = true;
                    } else {
                        rowValid = false;
                    }
                });
            }

            if (rowValid) {
                resultOfFilter.push(item);
            }
        }

        return resultOfFilter;
    }
    
}