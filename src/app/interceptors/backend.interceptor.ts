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

const conceptParents = [];

for (let i = 1; i < 6; i++){
    conceptParents.push(
        {name: 'Parent ' + i, type: ''}
    );
}

const conceptChildren = [];

for (let i = 1; i < 6; i++){
    conceptChildren.push(
        {name: 'Child ' + i, type: ''}
    );
}

const conceptRelationships = [];

for (let i = 1; i < 5; i++){
    conceptRelationships.push(
        [
            'Occurrence  >  Congenital',
            'Pathological process   >  Pathological developmental process',
            'Finding site  >  Pulmonary valve structure',
            'Associated morphology  >  Stenosis'
        ]
    );
}

const conceptDescriptions = [];

for (let i = 1; i < 4; i++){

    let term;
    let language;

    if (i == 1){

        language = 'US English';
        term = 'Generic Concept';
    } else if (i == 2){

        language = 'Belgian French';
        term = 'Concept générique';
    } else {

        language = 'Flemish';
        term = 'Generiek concept';
    }

    conceptDescriptions.push(
        {languageId: i.toString(), term: term, language: language, type: 'PT'}
    );
}

const conceptData = [
    { code: '49727002', relationships: conceptRelationships, parents: conceptParents, children: conceptChildren, descriptions: conceptDescriptions, status: 'Active', historyVisible: true, feedbackVisible: true, feedback: '', modified: '2020-01-15' },
    { code: '84229001', relationships: conceptRelationships, parents: conceptParents, children: conceptChildren, descriptions: conceptDescriptions, status: 'Active', historyVisible: true, feedbackVisible: true, feedback: '', modified: '2020-01-15' },
];

for (let i = 0; i < 300; i++){

    const descriptions = JSON.parse(JSON.stringify(conceptDescriptions));

    descriptions.forEach(description => {
        description.term += ' ' + i.toString();
    });

    conceptData.push(
        { code: i.toString(), relationships: conceptRelationships, parents: conceptParents, children: conceptChildren, descriptions: descriptions, status: 'Active', historyVisible: true, feedbackVisible: true, feedback: '', modified: '2020-01-15' }
    );
}

const refsetData = [
    { id: '1001', refsetId: '1001', name: 'Refset 1', editionName: 'US English', organizationName: 'SNOMED CT US', edition: {name: 'US', country: 'US'}, organization: 'SNOMED INT', versionStatus: 'Published', versionNotes: 'Notes on refset 1 version', narrative: 'Narrative text on refset 1.', tags: ['blood', 'findings'], url: 'to be implemented', definition: '', versionDate: '2020-01-15', modified: '2020-01-15', status: 'active', type: 'extensional', privateRefset: false, downloadable: true, feedbackVisible: true, feedback: '' },
    { id: '1002', refsetId: '1002', name: 'Refset 2', editionName: 'US English', organizationName: 'SNOMED CT US', edition: {name: 'US', country: 'US'}, organization: 'SNOMED INT', versionStatus: 'Published', versionNotes: 'Notes on refset 2 version', narrative: 'Narrative text on refset 2.', tags: ['disease', 'procedures'], url: 'to be implemented', definition: [{value: '< 12345', negated: false}, {clause: '< 98765', negated: true}], versionDate: '2020-01-15', modified: '2020-01-15', status: 'active', type: 'intensional', privateRefset: false, downloadable: false, feedbackVisible: true, feedback: '' },
    { id: '1003', refsetId: '1003', name: 'Refset 3', editionName: 'US English', organizationName: 'SNOMED CT US', edition: {name: 'US', country: 'US'}, organization: 'SNOMED INT', versionStatus: 'Beta', versionNotes: 'Notes on refset 3 version', narrative: 'Narrative text on refset 3.', tags: ['blood', 'procedures'], url: 'to be implemented', definition: '', versionDate: '2020-01-15', modified: '2020-01-15', status: 'active', type: 'extensional', privateRefset: false, downloadable: true, feedbackVisible: false, feedback: '' },
    { id: '1004', refsetId: '1004', name: 'Refset 4', editionName: 'US English', organizationName: 'SNOMED CT US', edition: {name: 'US', country: 'US'}, organization: 'SNOMED INT', versionStatus: 'In Development', versionNotes: 'Notes on refset 4 version', narrative: 'Narrative text on refset 4.', tags: ['global'], url: 'to be implemented', definition: '', versionDate: '2020-01-15', modified: '2020-01-15', status: 'active', type: 'extensional', privateRefset: true, downloadable: true, feedbackVisible: true, feedback: '' },
    { id: '1005', refsetId: '1005', name: 'Refset 5', editionName: 'US English', organizationName: 'SNOMED CT US', edition: {name: 'US', country: 'US'}, organization: 'SNOMED INT', versionStatus: 'In Development', versionNotes: 'Notes on refset 5 version', narrative: 'Narrative text on refset 5.', tags: ['allergy', 'outdoors'], url: 'to be implemented', definition: '', versionDate: '2020-01-15', modified: '2020-01-15', status: 'active', type: 'extensional', privateRefset: true, downloadable: true, feedbackVisible: true, feedback: '' }
];

for (let i = 6; i < 306; i++){
    refsetData.push(
        { id: (1000 + i).toString(), refsetId: (1000 + i).toString(), name: 'Refset ' + (1000 + i), editionName: 'US English', organizationName: 'SNOMED CT US', edition: {name: 'US', country: 'US'}, organization: 'SNOMED INT', versionStatus: 'In Development', versionNotes: 'Notes on refset ' + (1000 + i) + ' version', narrative: 'Narrative text on refset ' + (1000 + i) + '.', tags: ['general surgery', 'outpatient'], url: 'to be implemented', definition: '', versionDate: '2020-01-15', modified: '2020-01-15', status: 'active', type: 'extensional', privateRefset: true, downloadable: true, feedbackVisible: true, feedback: '' }
    );
}

@Injectable()
export class BackendInterceptor implements HttpInterceptor {

    intercept(request: HttpRequest<any>, next: HttpHandler): Observable<HttpEvent<any>> {

        const { url, method, headers, body } = request;
        let totalResults = 0;
        let params: any = CodeUtility.getParamsAsObject(request.url);

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
                    case url.includes('/members') && method === 'GET':
                        return concepts();
                    case url.includes('/refset/') && method === 'GET':
                        return refset();
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

            let rowsThisPage = sortAndFilter(conceptData);

            return ok({
                totalKnown: true,
                totalResults: totalResults,
                languages: [{languageId: '1', languageName: 'US English (PT)'}, {languageId: '2', languageName: 'Belgian French (PT)'}, {languageId: '3', languageName: 'Flemish (PT)'}],
                items: rowsThisPage
            });
        }

        function refset() {

            let refsetId = Number.parseInt(request.url.substr(request.url.indexOf('/refset/') + 8)) - 1001;

            return ok(refsetData[refsetId]);
        }

        function refsets(numberToReturn: number = 0) {

            let viewFilter = params.viewFilter;

            let dataAfterViewFilter = refsetData.filter(row => {

                let rowValid = true;

                if (viewFilter && viewFilter !== 'all' && (viewFilter === 'public' && row.privateRefset == true) || (viewFilter === 'private' && row.privateRefset == false)){
                    rowValid = false;
                }

                return rowValid;
            });

            let rowsThisPage = sortAndFilter(dataAfterViewFilter);

            if (numberToReturn > 0){
                rowsThisPage = rowsThisPage[0];
            }

            return ok({
                //totalKnown: false,
                //totalResults: totalResults,
                items: rowsThisPage
            });
        }

        function getUserById() {
            if (!isLoggedIn()) return unauthorized();

            const user = userData.find(u => u.id === idFromUrl());
            return ok(user);
        }

        //***** Sort and Filter Function *****/
        function sortAndFilter(allOfTheData) {

            let pageNumber = params.offset ? Number.parseInt(params.offset) : 0;
            let rowsPerPage = params.limit ? Number.parseInt(params.limit) : 100;
            let sortModel = params.sortModel;
            let filterModel = params.filterModel;
            let startRow = (pageNumber) * rowsPerPage;
            let endRow = startRow + rowsPerPage;

            if (sortModel) {
                sortModel = Object.values(sortModel);
            }

            let dataAfterSortingAndFiltering = UiUtility.sortData(sortModel, UiUtility.filterData(filterModel, allOfTheData));

            let rowsThisPage = dataAfterSortingAndFiltering.slice(
                startRow,
                endRow
            );

            totalResults = dataAfterSortingAndFiltering.length;

            return rowsThisPage;
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