import {
    HttpEvent,
    HttpHandler,
    HttpInterceptor,
    HttpRequest,
    HttpResponse
} from '@angular/common/http';
import { Injectable, Injector } from '@angular/core';
import { Observable, of, throwError } from 'rxjs';
import { delay, mergeMap, materialize, dematerialize } from 'rxjs/operators';
import { Concept } from 'src/app/models/concept';
import { User } from 'src/app/models/user';
import { CodeUtility } from 'src/app/utilities/code.utility';

const userData: User[] = [
    { firstName: 'Joe', lastName: 'Smith', email: 'jsmith@email.com', username: 'jsmith', langKey: 'en', roles: ['editor', 'admin'], password: 'jsmith' },
    { firstName: 'Nancy', lastName: 'Drew', email: 'ndrew@email.com', username: 'ndrew', langKey: 'en', roles: ['read', 'review'], password: 'ndrew' }
];

const conceptData = [
    { conceptId: '448006009', description: 'Atrial septum intact', descriptionType: 'PT', status: 'Active', feedback: 'comment' },
    { conceptId: '442119001', description: 'Cardiac shunt (finding)', descriptionType: 'FSN', status: 'Active', feedback: '' },
    { conceptId: '249042007', description: 'Fetal heart finding', descriptionType: 'PT', status: 'Active', feedback: '' },
    { conceptId: '56265001', description: 'Heart disease (disorder)', descriptionType: 'FSN', status: 'Active', feedback: '' },
    { conceptId: '00000001', description: 'Test Concept 1', descriptionType: 'PT', status: 'Inactive', feedback: '' },
    { conceptId: '00000002', description: 'Test Concept 2', descriptionType: 'PT', status: 'Inactive', feedback: '' },
    { conceptId: '00000003', description: 'Test Concept 3', descriptionType: 'PT', status: 'Inactive', feedback: '' },
    { conceptId: '00000004', description: 'Test Concept 4', descriptionType: 'PT', status: 'Inactive', feedback: '' },
    { conceptId: '00000005', description: 'Test Concept 5', descriptionType: 'PT', status: 'Inactive', feedback: '' },
    { conceptId: '00000006', description: 'Test Concept 6', descriptionType: 'PT', status: 'Inactive', feedback: '' },
    { conceptId: '00000007', description: 'Test Concept 7', descriptionType: 'PT', status: 'Inactive', feedback: '' },
    { conceptId: '00000008', description: 'Test Concept 8', descriptionType: 'PT', status: 'Inactive', feedback: '' },
    { conceptId: '00000009', description: 'Test Concept 9', descriptionType: 'PT', status: 'Inactive', feedback: '' },
];

const refsetData = [
    { id: '1001', name: 'Refset 1', edition: 'US', organization: 'SNOMED INT', versionStatus: 'Published', narrative: '', tags: '', url: '', definition: '', versionDate: '2020-01-15', modifiedDate: '2020-01-15', status: 'active', type: 'extensional', private: false, canDownload: true, canSeeFeedback: true, feedback: '' },
    { id: '1002', name: 'Refset 2', edition: 'US', organization: 'SNOMED INT', versionStatus: 'Published', narrative: '', tags: '', url: '', definition: '< 56265001', versionDate: '2020-01-15', modifiedDate: '2020-01-15', status: 'active', type: 'intensional', private: false, canDownload: false, canSeeFeedback: true, feedback: '' },
    { id: '1003', name: 'Refset 3', edition: 'US', organization: 'SNOMED INT', versionStatus: 'Beta', narrative: '', tags: '', url: '', definition: '', versionDate: '2020-01-15', modifiedDate: '2020-01-15', status: 'active', type: 'extensional', private: false, canDownload: true, canSeeFeedback: false, feedback: '' },
    { id: '1004', name: 'Refset 4', edition: 'US', organization: 'SNOMED INT', versionStatus: 'In Development', narrative: '', tags: '', url: '', definition: '', versionDate: '2020-01-15', modifiedDate: '2020-01-15', status: 'active', type: 'extensional', private: true, canDownload: true, canSeeFeedback: true, feedback: '' },
    { id: '1005', name: 'Refset 1005', edition: 'US', organization: 'SNOMED INT', versionStatus: 'In Development', narrative: '', tags: '', url: '', definition: '', versionDate: '2020-01-15', modifiedDate: '2020-01-15', status: 'active', type: 'extensional', private: true, canDownload: true, canSeeFeedback: true, feedback: '' },
    { id: '1006', name: 'Refset 1006', edition: 'US', organization: 'SNOMED INT', versionStatus: 'In Development', narrative: '', tags: '', url: '', definition: '', versionDate: '2020-01-15', modifiedDate: '2020-01-15', status: 'active', type: 'extensional', private: true, canDownload: true, canSeeFeedback: true, feedback: '' },
    { id: '1007', name: 'Refset 1007', edition: 'US', organization: 'SNOMED INT', versionStatus: 'In Development', narrative: '', tags: '', url: '', definition: '', versionDate: '2020-01-15', modifiedDate: '2020-01-15', status: 'active', type: 'extensional', private: true, canDownload: true, canSeeFeedback: true, feedback: '' },
    { id: '1008', name: 'Refset 1008', edition: 'US', organization: 'SNOMED INT', versionStatus: 'In Development', narrative: '', tags: '', url: '', definition: '', versionDate: '2020-01-15', modifiedDate: '2020-01-15', status: 'active', type: 'extensional', private: true, canDownload: true, canSeeFeedback: true, feedback: '' },
    { id: '1009', name: 'Refset 1009', edition: 'US', organization: 'SNOMED INT', versionStatus: 'In Development', narrative: '', tags: '', url: '', definition: '', versionDate: '2020-01-15', modifiedDate: '2020-01-15', status: 'active', type: 'extensional', private: true, canDownload: true, canSeeFeedback: true, feedback: '' },
    { id: '1010', name: 'Refset 1010', edition: 'US', organization: 'SNOMED INT', versionStatus: 'In Development', narrative: '', tags: '', url: '', definition: '', versionDate: '2020-01-15', modifiedDate: '2020-01-15', status: 'active', type: 'extensional', private: true, canDownload: true, canSeeFeedback: true, feedback: '' },
    { id: '1011', name: 'Refset 1011', edition: 'US', organization: 'SNOMED INT', versionStatus: 'In Development', narrative: '', tags: '', url: '', definition: '', versionDate: '2020-01-15', modifiedDate: '2020-01-15', status: 'active', type: 'extensional', private: true, canDownload: true, canSeeFeedback: true, feedback: '' },
    { id: '1012', name: 'Refset 1012', edition: 'US', organization: 'SNOMED INT', versionStatus: 'In Development', narrative: '', tags: '', url: '', definition: '', versionDate: '2020-01-15', modifiedDate: '2020-01-15', status: 'active', type: 'extensional', private: true, canDownload: true, canSeeFeedback: true, feedback: '' },
    { id: '1013', name: 'Refset 1013', edition: 'US', organization: 'SNOMED INT', versionStatus: 'In Development', narrative: '', tags: '', url: '', definition: '', versionDate: '2020-01-15', modifiedDate: '2020-01-15', status: 'active', type: 'extensional', private: true, canDownload: true, canSeeFeedback: true, feedback: '' },
    { id: '1014', name: 'Refset 1014', edition: 'US', organization: 'SNOMED INT', versionStatus: 'In Development', narrative: '', tags: '', url: '', definition: '', versionDate: '2020-01-15', modifiedDate: '2020-01-15', status: 'active', type: 'extensional', private: true, canDownload: true, canSeeFeedback: true, feedback: '' },
    { id: '1015', name: 'Refset 1015', edition: 'US', organization: 'SNOMED INT', versionStatus: 'In Development', narrative: '', tags: '', url: '', definition: '', versionDate: '2020-01-15', modifiedDate: '2020-01-15', status: 'active', type: 'extensional', private: true, canDownload: true, canSeeFeedback: true, feedback: '' },
    { id: '1016', name: 'Refset 1016', edition: 'US', organization: 'SNOMED INT', versionStatus: 'In Development', narrative: '', tags: '', url: '', definition: '', versionDate: '2020-01-15', modifiedDate: '2020-01-15', status: 'active', type: 'extensional', private: true, canDownload: true, canSeeFeedback: true, feedback: '' },
    { id: '1017', name: 'Refset 1017', edition: 'US', organization: 'SNOMED INT', versionStatus: 'In Development', narrative: '', tags: '', url: '', definition: '', versionDate: '2020-01-15', modifiedDate: '2020-01-15', status: 'active', type: 'extensional', private: true, canDownload: true, canSeeFeedback: true, feedback: '' },
];

@Injectable()
export class BackendInterceptor implements HttpInterceptor {

    intercept(request: HttpRequest<any>, next: HttpHandler): Observable<HttpEvent<any>> {

        const { url, method, headers, body } = request;

        // wrap in delayed observable to simulate server api call
        return of(null)
            .pipe(mergeMap(handleRoute))
            .pipe(materialize()) // call materialize and dematerialize to ensure delay even if an error is thrown (https://github.com/Reactive-Extensions/RxJS/issues/648)
            .pipe(delay(500))
            .pipe(dematerialize());

        function handleRoute() {
            switch (true) {
                case url.endsWith('/auth') && method === 'POST':
                    return authenticate();
                case url.endsWith('/concepts') && method === 'GET':
                    return concepts();
                case url.includes('/refsets') && method === 'GET':
                    return refsets();
                case url.match(/\/users\/\d+$/) && method === 'GET':
                    return getUserById();
                default:
                    // pass through any requests not handled above
                    return next.handle(request);
            }
        }

        // route functions
        function authenticate() {

            const { username, password } = body;
            const user = userData.find(u => u.username === username && u.password === password);

            if (!user) {
                return error('Username or password is incorrect');
            }

            return ok({
                ...user,
                token: 'fake-jwt-token'
            })
        }

        function concepts() {
            return ok({
                totalKnown: true,
                totalResults: conceptData.length,
                data: conceptData
            });
        }

        function refsets() {

            //let queryString = request.url.substr(request.url.indexOf('?') + 1);
            let params: any = CodeUtility.getParamsAsObject(request.url);
            let pageNumber = Number.parseInt(params.pageNumber);
            let rowsPerPage = Number.parseInt(params.rowsPerPage);
            let sortModel = params.sortModel;
            let filterModel = params.filterModel;
            let viewFilter = params.viewFilter;
            let startRow = (pageNumber - 1) * rowsPerPage;
            let endRow = startRow + rowsPerPage;

            if (sortModel) {
                sortModel = Object.values(sortModel);
            }
            // let pageNumber = Number.parseInt(request.params.get("pageNumber"));
            // let rowsPerPage = Number.parseInt(request.params.get("rowsPerPage"));
            // let sortModel = request.params.get("sortModel");
            // let filterModel = request.params.get("filterModel");

            let dataAfterViewFilter = refsetData.filter(row => {

                let rowValid = true;

                if (viewFilter !== 'all' && (viewFilter === 'public' && row.private == true) || (viewFilter === 'private' && row.private == false)){
                    rowValid = false;
                }

                return rowValid;
            });

            let dataAfterSortingAndFiltering = sortAndFilter(
                dataAfterViewFilter,
                sortModel,
                filterModel
            );

            let rowsThisPage = dataAfterSortingAndFiltering.slice(
                startRow,
                endRow
            );

            return ok({
                totalKnown: true,
                totalResults: dataAfterSortingAndFiltering.length,
                data: rowsThisPage
            });
        }

        function getUserById() {
            if (!isLoggedIn()) return unauthorized();

            const user = userData.find(u => u.id === idFromUrl());
            return ok(user);
        }

        //***** Sort and Filter Function *****/
        // sortModel: [{sort: 'asc', colId: columnName1}, {sort: 'asc', colId: columnName1}]
        // filterModel: {columnName1:{filterType: 'text', filter: 'filter text'}, columnName2:{filterType: 'text', filter: 'filter text'}}
        function sortAndFilter(allOfTheData, sortModel, filterModel) {
            return sortData(sortModel, filterData(filterModel, allOfTheData));
        }

        function sortData(sortModel, data) {

            let sortPresent = sortModel && sortModel.length > 0;

            if (!sortPresent) {
                return data;
            }

            let resultOfSort = data.slice();

            resultOfSort.sort(function (a, b) {

                for (let k = 0; k < sortModel.length; k++) {

                    let sortColModel = sortModel[k];
                    let valueA = a[sortColModel.colId];
                    let valueB = b[sortColModel.colId];

                    if (valueA == valueB) {
                        continue;
                    }

                    let sortDirection = sortColModel.sort === 'asc' ? 1 : -1;

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

        function filterData(filterModel, data) {

            let filterPresent = filterModel && Object.keys(filterModel).length > 0;

            if (!filterPresent) {
                return data;
            }

            let resultOfFilter = [];

            for (let i = 0; i < data.length; i++) {

                let item = data[i];
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

        //***** Helper Function *****/
        function ok(body?) {
            return of(new HttpResponse({ status: 200, body }))
        }

        function error(message) {
            return throwError({ error: { message } });
        }

        function unauthorized() {
            return throwError({ status: 401, error: { message: 'Unauthorised' } });
        }

        function isLoggedIn() {
            return headers.get('Authorization') === 'Bearer fake-jwt-token';
        }

        function idFromUrl() {
            const urlParts = url.split('/');
            return parseInt(urlParts[urlParts.length - 1]);
        }
    }
}