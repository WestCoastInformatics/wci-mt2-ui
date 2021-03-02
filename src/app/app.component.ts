import { Component, OnInit, ViewChild, AfterViewInit, TemplateRef } from '@angular/core';
import 'jquery';
import { Title } from '@angular/platform-browser';
import { AuthoringService } from './services/authoring/authoring.service';
import { EnvService } from './services/environment/env.service';
import { MatPaginator, PageEvent } from '@angular/material/paginator';
import { MatTableDataSource } from '@angular/material/table';
import { MatSort } from '@angular/material/sort';
import { DialogService } from './dialog/services/dialog.service';
import { DialogFactoryService } from './dialog/services/dialog-factory.service';
import { Observable } from 'rxjs';
import { ConceptsService } from './services/rest/concepts.service';
import { AgGridAngular } from 'ag-grid-angular';
import { ConceptFeedbackRenderer } from './components/cellRenderers/concept-feedback.renderer';

@Component({
    selector: 'app-root',
    templateUrl: './app.component.html',
    styleUrls: ['./app.component.scss']
})

export class AppComponent implements OnInit {

    @ViewChild('conceptFeedbackDialog') conceptFeedbackDialog: TemplateRef<any>;
    @ViewChild('feedbackSection') feedbackSection: TemplateRef<any>;
    @ViewChild('agFeedbackSection') agFeedbackSection: TemplateRef<any>;
    @ViewChild(MatPaginator) paginator: MatPaginator;
    @ViewChild(MatSort) sort: MatSort;
    @ViewChild('agGrid') agGrid: AgGridAngular;

    versions: object;
    environment: string;
    displayedColumns: string[] = ['conceptId', 'description', 'descriptionType', 'status', 'feedback'];
    filterValues = {};
    columnDefs = [];
    conceptTable: any;
    conceptAgGridDatasource: Observable<any>;
    conceptMaterialDatasource = new MatTableDataSource();
    conceptGridOptions: any;
    conceptGridPaging = {
        length: 0,
        pageIndex: 0,
        pageSize: 10,
        pageSizeOptions: [10, 25, 50]
    };
    pageEvent: PageEvent;
    agGridConceptsApi: any;
    agGridConceptsColumnApi: any;
    dialog: DialogService;


    constructor(private authoringService: AuthoringService,
        private envService: EnvService,
        private titleService: Title,
        private dialogFactoryService: DialogFactoryService,
        private conceptsService: ConceptsService) {

        this.columnDefs = [
            { field: 'conceptId', headerName: 'Concept ID' },
            { field: 'description', headerName: 'Description' },
            { field: 'descriptionType', headerName: 'Description Type' },
            { field: 'status', headerName: 'Status' },
            { field: 'feedback', headerName: 'Feedback', contentTemplate: 'feedbackSection', cellRenderer: 'conceptFeedbackRenderer', cellRendererParams: { template: 'agFeedbackSection' } }
        ];

        this.conceptGridOptions = {
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

        this.titleService.setTitle('Refset Tool');
        this.environment = this.envService.env;

        // this.authoringService.getVersions().subscribe(versions => {
        //     this.versions = versions;
        // });

        // this.authoringService.getUIConfiguration().subscribe(config => {
        //     this.authoringService.uiConfiguration = config;
        // });

        this.assignFavicon();

        let req = this.conceptsService.getConcepts();

        req.subscribe(result => {

            this.conceptTable = result.data;
            this.conceptMaterialDatasource.data = this.conceptTable;
        });

        // Overrride default filter behaviour of table
        this.conceptMaterialDatasource.filterPredicate = this.createFilter();
    }

    ngAfterViewInit() {

        this.conceptMaterialDatasource.paginator = this.paginator;
        this.conceptMaterialDatasource.sort = this.sort;
    }

    //***** AG Grid Functions *****/
    onGridReady = (params) => {

        this.agGridConceptsApi = params.api;
        this.agGridConceptsColumnApi = params.columnApi;

        this.conceptsService.getConcepts().subscribe(results => {

            var dataSource = {
                rowCount: null,
                getRows: (params) => {

                    let data = results.data;

                    //params.api.showLoadingOverlay();

                    var pageNumber = params.endRow / this.conceptGridPaging.pageSize;

                    if (data.length > 0) {

                        //params.api.hideOverlay();
                        var totalRowCount = null;

                        if (results.totalKnown || data.length < this.conceptGridPaging.pageSize) {

                            if (results.totalKnown) {
                                totalRowCount = results.totalResults;
                            } else {
                                totalRowCount = data.length + ((pageNumber - 1) * this.conceptGridPaging.pageSize);
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

                        this.conceptGridPaging.length = totalRowCount;
                        params.successCallback(this.pagingIterator(rowsThisPage), lastRow);
                    } else {

                        this.agGridConceptsApi.api.showNoRowsOverlay();
                        params.successCallback(data, 0);
                    }
                }
            };

            params.api.setDatasource(dataSource);
        });
    }

    private pagingIterator(data: any[]) {

        const end = (this.conceptGridPaging.pageIndex + 1) * this.conceptGridPaging.pageSize;
        const start = this.conceptGridPaging.pageIndex * this.conceptGridPaging.pageSize;
        return data.slice(start, end);
    }

    onGridCellClick = (event) => {

        if (event.column.colId === 'feedback') {


        } else {

            let selectedRows = this.agGridConceptsApi.getSelectedRows();
            console.log(selectedRows);
            selectedRows.forEach(function (selectedRow, index) {
                console.log('Selected Row: ' + selectedRow.conceptId);
            });
        }
    }

    onConceptGridPageChange(event: PageEvent) {

        console.log("********* event: ", event);
        this.conceptGridPaging.length = event.length;
        this.conceptGridPaging.pageSize = event.pageSize;
        this.conceptGridPaging.pageIndex = event.pageIndex;
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

    //***** Material Table Functions *****/

    // Called on Filter change
    filterChange(filter, event) {

        //let filterValues = {}
        this.filterValues[filter.field] = event.target.value.trim().toLowerCase()
        this.conceptMaterialDatasource.filter = JSON.stringify(this.filterValues)
    }

    // Custom filter method for table
    createFilter() {

        let filterFunction = function (data: any, filter: string): boolean {

            let searchTerms = JSON.parse(filter);
            let isFilterSet = false;

            console.log("data: ", data);
            console.log("filter: ", filter);

            // make sure that there is a term in each column
            for (const column in searchTerms) {

                console.log("column in searchTerms: ", column);

                // if the there's no term in the column then remove it
                if (searchTerms[column].toString() !== '') {
                    isFilterSet = true;
                } else {
                    delete searchTerms[column];
                }
            }

            console.log("after: ", searchTerms);

            let termSearch = () => {

                let rowValid = true;

                // if there is something to search on
                if (isFilterSet) {

                    // loop thru each column with a search term
                    for (const column in searchTerms) {

                        // test each word in the term
                        searchTerms[column].trim().toLowerCase().split(' ').forEach(word => {

                            // the search word must be present in the data and the row must still be valid
                            if (data[column].toString().toLowerCase().indexOf(word) != -1 && rowValid) {
                                rowValid = true;
                            } else {
                                rowValid = false;
                            }
                        });
                    }

                    return rowValid;
                } else {
                    return true;
                }
            }

            return termSearch();
        }
        return filterFunction
    }

    // Reset table filters
    resetFilters() {

        this.filterValues = {}

        this.columnDefs.forEach((value, key) => {
            value.modelValue = undefined;
        })

        this.conceptMaterialDatasource.filter = "";
    }

    //***** General Functions *****/
    openFeedback(conceptId: string) {

        let concept;

        for (let i = 0; i < this.conceptTable.length; i++) {

            if (this.conceptTable[i].conceptId == conceptId) {

                concept = this.conceptTable[i];
                break;
            }
        }

        const dialogData = {
            headerText: `Concept Feedback for ${concept.description} (${concept.conceptId})`,
            template: this.conceptFeedbackDialog,
            data: concept
        }

        this.dialog = this.dialogFactoryService.open(dialogData);

        this.dialog.confirmed().subscribe(data => {
            if (data) {
                concept.feedback = data.feedback;
            }
        });
    }

    assignFavicon() {

        const favicon = $('#favicon');

        switch (this.environment) {
            case 'local':
                favicon.attr('href', 'favicon_purple.ico');
                break;
            case 'dev':
                favicon.attr('href', 'favicon_green.ico');
                break;
            case 'uat':
                favicon.attr('href', 'favicon_blue.ico');
                break;
            case 'training':
                favicon.attr('href', 'favicon_yellow.ico');
                break;
            default:
                favicon.attr('href', 'favicon_red.ico');
                break;
        }
    }
}
