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
import { environment } from 'src/environments/environment';
import { UiUtility } from '../utilities/ui.utility';

const userData: User[] = [
    { firstName: 'Joe', lastName: 'Smith', email: 'jsmith@email.com', username: 'jsmith', langKey: 'en', roles: ['editor', 'admin'], password: 'jsmith' },
    { firstName: 'Nancy', lastName: 'Drew', email: 'ndrew@email.com', username: 'ndrew', langKey: 'en', roles: ['read', 'review'], password: 'ndrew' }
];

const conceptData = [
    { conceptId: '49727002', descriptions: [{id: '1', description: 'Cough', language: 'US English', type: 'PT'}, {id: '2', description: 'Toux', language: 'Belgian French', type: 'PT'}, {id: '3', description: 'bevindingen over hoesten', language: 'Flemish', type: 'PT'}], status: 'Active', historyVisible: true, feedbackVisible: true, feedback: '' },
    { conceptId: '84229001', descriptions: [{id: '1', description: 'Fatigue', language: 'US English', type: 'PT'}, {id: '2', description: 'Fatigue', language: 'Belgian French', type: 'PT'}, {id: '3', description: 'vermoeidheid', language: 'Flemish', type: 'PT'}], status: 'Active', historyVisible: true, feedbackVisible: true, feedback: '' },

];

const refsetData = [
    { id: '0001', refsetId: '0001', name: 'Refset 1', editionName: 'US English', organizationName: 'SNOMED CT US', edition: {name: 'US', country: 'US'}, organization: 'SNOMED INT', versionStatus: 'Published', versionNotes: 'Notes on refset 1 version', narrative: 'Narrative text on refset 1.', tags: ['blood', 'findings'], url: 'to be implemented', definition: '', versionDate: '2020-01-15', modified: '2020-01-15', status: 'active', type: 'extensional', privateRefset: false, downloadable: true, feedbackVisible: true, feedback: '' },
    { id: '0002', refsetId: '0002', name: 'Refset 2', editionName: 'US English', organizationName: 'SNOMED CT US', edition: {name: 'US', country: 'US'}, organization: 'SNOMED INT', versionStatus: 'Published', versionNotes: 'Notes on refset 2 version', narrative: 'Narrative text on refset 2.', tags: ['disease', 'procedures'], url: 'to be implemented', definition: [{value: '< 12345', negated: false}, {clause: '< 98765', negated: true}], versionDate: '2020-01-15', modified: '2020-01-15', status: 'active', type: 'intensional', privateRefset: false, downloadable: false, feedbackVisible: true, feedback: '' },
    { id: '0003', refsetId: '0003', name: 'Refset 3', editionName: 'US English', organizationName: 'SNOMED CT US', edition: {name: 'US', country: 'US'}, organization: 'SNOMED INT', versionStatus: 'Beta', versionNotes: 'Notes on refset 3 version', narrative: 'Narrative text on refset 3.', tags: ['blood', 'procedures'], url: 'to be implemented', definition: '', versionDate: '2020-01-15', modified: '2020-01-15', status: 'active', type: 'extensional', privateRefset: false, downloadable: true, feedbackVisible: false, feedback: '' },
    { id: '0004', refsetId: '0004', name: 'Refset 4', editionName: 'US English', organizationName: 'SNOMED CT US', edition: {name: 'US', country: 'US'}, organization: 'SNOMED INT', versionStatus: 'In Development', versionNotes: 'Notes on refset 4 version', narrative: 'Narrative text on refset 4.', tags: ['global'], url: 'to be implemented', definition: '', versionDate: '2020-01-15', modified: '2020-01-15', status: 'active', type: 'extensional', privateRefset: true, downloadable: true, feedbackVisible: true, feedback: '' },
    { id: '0005', refsetId: '0005', name: 'Refset 5', editionName: 'US English', organizationName: 'SNOMED CT US', edition: {name: 'US', country: 'US'}, organization: 'SNOMED INT', versionStatus: 'In Development', versionNotes: 'Notes on refset 5 version', narrative: 'Narrative text on refset 5.', tags: ['allergy', 'outdoors'], url: 'to be implemented', definition: '', versionDate: '2020-01-15', modified: '2020-01-15', status: 'active', type: 'extensional', privateRefset: true, downloadable: true, feedbackVisible: true, feedback: '' }
];

for (let i = 0; i < 300; i++){
    refsetData.push(
        { id: (1000 + i).toString(), refsetId: (1000 + i).toString(), name: 'Refset ' + (1000 + i), editionName: 'US English', organizationName: 'SNOMED CT US', edition: {name: 'US', country: 'US'}, organization: 'SNOMED INT', versionStatus: 'In Development', versionNotes: 'Notes on refset ' + (1000 + i) + ' version', narrative: 'Narrative text on refset ' + (1000 + i) + '.', tags: ['general surgery', 'outpatient'], url: 'to be implemented', definition: '', versionDate: '2020-01-15', modified: '2020-01-15', status: 'active', type: 'extensional', privateRefset: true, downloadable: true, feedbackVisible: true, feedback: '' }
    )
}

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

            if (environment.hasOwnProperty('mockRestData') && environment['mockRestData']){

                switch (true) {
                    case url.endsWith('/auth') && method === 'POST':
                        return authenticate();
                    case url.endsWith('/concepts') && method === 'GET':
                        return concepts();
                    case url.includes('/refset/search') && method === 'GET':
                        return refsets();
                    case url.includes('/refset/members/list') && method === 'GET':
                        return concepts();
                    case url.includes('/refset/') && method === 'GET':
                        return refsets(1);
                    case url.match(/\/users\/\d+$/) && method === 'GET':
                        return getUserById();
                    default:
                        // pass through any requests not handled above
                        return next.handle(request); 
                }
            } else {
                
                switch (true) {

                    case url.includes('/refset/members/list') && method === 'GET':
                        return concepts();
                    default:
                        // pass through any requests not handled above
                        return next.handle(request); 
                }
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
                languages: [{languageId: '1', name: 'US English (PT)'}, {languageId: '2', name: 'Belgian French (PT)'}, {languageId: '3', name: 'Flemish (PT)'}],
                items: conceptData
            });
        }

        function refsets(numberToReturn: number = 0) {

            //let queryString = request.url.substr(request.url.indexOf('?') + 1);
            let params: any = CodeUtility.getParamsAsObject(request.url);
            let pageNumber = params.offset ? Number.parseInt(params.offset) : 0;
            let rowsPerPage = params.limit ? Number.parseInt(params.limit) : 100;
            let sortModel = params.sortModel;
            let filterModel = params.filterModel;
            let viewFilter = params.viewFilter;
            let startRow = (pageNumber) * rowsPerPage;
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

                if (viewFilter && viewFilter !== 'all' && (viewFilter === 'public' && row.privateRefset == true) || (viewFilter === 'private' && row.privateRefset == false)){
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

            if (numberToReturn > 0){
                rowsThisPage = rowsThisPage[0];
            }

            return ok({
                totalKnown: true,
                totalResults: dataAfterSortingAndFiltering.length,
                items: rowsThisPage
            });
        }

        function getUserById() {
            if (!isLoggedIn()) return unauthorized();

            const user = userData.find(u => u.id === idFromUrl());
            return ok(user);
        }

        //***** Sort and Filter Function *****/
        function sortAndFilter(allOfTheData, sortModel, filterModel) {
            return UiUtility.sortData(sortModel, UiUtility.filterData(filterModel, allOfTheData));
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