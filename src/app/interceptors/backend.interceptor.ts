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
import { Concept } from '../models/concept';
import { User } from '../models/user';

const userData: User[] = [
    { firstName: 'Joe', lastName: 'Smith', email: 'jsmith@email.com', username: 'jsmith', langKey: 'en', roles: ['editor', 'admin'], password: 'jsmith'},
    { firstName: 'Nancy', lastName: 'Drew', email: 'ndrew@email.com', username: 'ndrew', langKey: 'en', roles: ['read', 'review'], password: 'ndrew'}
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
    { id: '1001', name: 'Refset 1', edition: 'US', organization: 'SNOMED INT', versionStatus: 'Published', narrative: '', tags: '', url: '', definition: '', versionDate: '2020-01-15', modifiedDate: '2020-01-15', status: 'active', type: 'extensional', private: false, canDownload: true, canSeeFeedback: true, feedback: ''},
    { id: '1002', name: 'Refset 2', edition: 'US', organization: 'SNOMED INT', versionStatus: 'Published', narrative: '', tags: '', url: '', definition: '< 56265001', versionDate: '2020-01-15', modifiedDate: '2020-01-15', status: 'active', type: 'intensional', private: false, canDownload: true, canSeeFeedback: true, feedback: ''},
    { id: '1003', name: 'Refset 3', edition: 'US', organization: 'SNOMED INT', versionStatus: 'Beta', narrative: '', tags: '', url: '', definition: '', versionDate: '2020-01-15', modifiedDate: '2020-01-15', status: 'active', type: 'extensional', private: false, canDownload: true, canSeeFeedback: true, feedback: ''},
    { id: '1004', name: 'Refset 4', edition: 'US', organization: 'SNOMED INT', versionStatus: 'In Development', narrative: '', tags: '', url: '', definition: '', versionDate: '2020-01-15', modifiedDate: '2020-01-15', status: 'active', type: 'extensional', private: true, canDownload: true, canSeeFeedback: true, feedback: ''},
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
                case url.endsWith('/refsets') && method === 'GET':
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
            return ok({
                totalKnown: true,
                totalResults: conceptData.length,
                data: refsetData
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
            return this.sortData(sortModel, this.filterData(filterModel, allOfTheData));
        }
    
        function sortData(sortModel, data) {
    
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
    
        function filterData(filterModel, data) {
    
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