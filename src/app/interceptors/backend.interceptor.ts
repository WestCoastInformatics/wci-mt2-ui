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
import { RefsetService } from '../services/rest/refset.service';
import { UiUtility } from '../utilities/ui.utility';

const userData: User[] = [
    { firstName: 'Joe', lastName: 'Smith', email: 'jsmith@email.com', username: 'jsmith', langKey: 'en', roles: ['editor', 'admin'], password: 'jsmith' },
    { firstName: 'Nancy', lastName: 'Drew', email: 'ndrew@email.com', username: 'ndrew', langKey: 'en', roles: ['read', 'review'], password: 'ndrew' }
];

const conceptDescriptions = [];

for (let i = 1; i < 5; i++){

    let term;
    let languageId;
    let languageName;

    if (i == 1){

        languageId = '101PT';
        languageName = 'EN (PT)';
        term = 'Generic Concept';

    } else if (i == 2){

        languageId = '101FSN';
        languageName = 'EN (FSN)';
        term = 'Generic Concept (Finding)';

    } else if (i == 3){

        languageId = '102PT';
        languageName = 'FR (PT)';
        term = 'Concept générique';
    } else {

        languageId = '103PT';
        languageName = 'NL (PT)';
        term = 'Generiek concept';
    }

    conceptDescriptions.push(
        {descriptionId: i.toString(), term: term, languageId: languageId, languageName: languageName, type: 'PT'}
    );
}

const conceptRoles = [];

for (let i = 1; i < 5; i++){
    conceptRoles.push(
        [
            'Occurrence  >  Congenital',
            'Pathological process   >  Pathological developmental process',
            'Finding site  >  Pulmonary valve structure',
            'Associated morphology  >  Stenosis'
        ]
    );
}

const taxonomyRootNode = {name: 'SNOMED CT Concept', code: '138875005', roles: conceptRoles, parents: [], children: [], descriptions: conceptDescriptions, root: true, status: 'Active', historyVisible: true, feedbackVisible: true, feedback: '', memberEffectiveTime: '2020-01-15', hasChildrenRefsetMembers: true, hasParentsRefsetMembers: false, memberOfRefset: false, hasChildren: true };
taxonomyRootNode.children = populateChildren(taxonomyRootNode);

function populateChildren(concept, level = 1){

    let children = [];
    let randomNotMember = Math.floor(Math.random() * 5) + 1;
    let randomNotMemberButChildrenAre;

    do {
        randomNotMemberButChildrenAre = Math.floor(Math.random() * 5) + 1;

    } while (randomNotMember == randomNotMemberButChildrenAre);

    for (let i = 1; i < 6; i++){

        let parentCode = concept.code;

        if (concept.root) {
            parentCode = '';
        }

        let thisConcept = {name: 'Level ' + level + ': Concept ' + level + parentCode + i, code: level + parentCode + i, roles: conceptRoles, parents: getTaxonomyFlatParentList(concept), children: [], descriptions: conceptDescriptions, status: 'Active', historyVisible: true, feedbackVisible: true, feedback: '', memberEffectiveTime: '2020-01-15', hasChildrenRefsetMembers: true, hasParentsRefsetMembers: true, memberOfRefset: true, hasChildren: true };

        if (level == 1 && (i == 2 || i == 4)) { 

            thisConcept.hasChildrenRefsetMembers = false;
            thisConcept.memberOfRefset = false;

        } else if (level > 1 && concept.hasChildrenRefsetMembers == false) {

            thisConcept.hasChildrenRefsetMembers = false;
            thisConcept.memberOfRefset = false;

        } else if (level > 1 && i == randomNotMember) {

            thisConcept.hasChildrenRefsetMembers = false;
            thisConcept.memberOfRefset = false;

        } else if (level > 1 && i == randomNotMemberButChildrenAre) {

            thisConcept.memberOfRefset = false;
        }

        if (level < 3){
            thisConcept.children = populateChildren(thisConcept, level + 1);
        }

        if (!CodeUtility.hasValue(thisConcept.children)) {
            
            thisConcept.hasChildren = false;
            thisConcept.children = null;
            thisConcept.hasChildrenRefsetMembers = false;
        }

        thisConcept.name = 'Level ' + level + ': Concept ' + level + parentCode + i + '; Member: ' + thisConcept.memberOfRefset + '; Member Children: ' + thisConcept.hasChildrenRefsetMembers;

        children.push(thisConcept);
    }

    return children;
}

function getTaxonomyConceptChildren(conceptId, level = 1){

    let children = null;
    let concept = findTaxonomyConcept(conceptId, [taxonomyRootNode]);

    if (concept != null) {

        if (CodeUtility.hasValue(concept.children)){
            children = [];
        }

        for (let child of concept.children) {

            let newChild = CodeUtility.clone(child);
            newChild.children = null;
            
            if (level > 1) {
                newChild.children = getNestedChildren(child, level - 1);
            }

            children.push(newChild);
        }
    }

    function getNestedChildren(node, level){

        let newTaxonomy = null;

        if (CodeUtility.hasValue(node.children)){
            newTaxonomy = [];
        }

        for (let childNode of node.children) {

            let newChild = CodeUtility.clone(childNode);
            newChild.children = null;

            if (level > 1) {
                newChild.children = getNestedChildren(childNode, level - 1);
            }

            newTaxonomy.push(newChild);
        }
        
        return newTaxonomy;
    }

    return children;
}

function findTaxonomyConcept(conceptId, nodes) { 

    for (let node of nodes) {

        if (node.code === conceptId){
            return node;
        
        } else if (CodeUtility.hasValue(node.children)) {

            let foundNode = findTaxonomyConcept(conceptId, node.children);

            if (foundNode != null) {
                return foundNode;
            }
        }
    }

    return null;
}

function getTaxonomyFlatParentList(concept) {

    let parentList = [];

    for (let parent of concept.parents) {

        if (parent.parents.length > 0) {
            parentList = getTaxonomyFlatParentList(parent.parents[0]);
        }

        parentList.push(parent);        
    }

    return parentList;
}

const conceptParents = [];
const conceptChildren = [];

for (let i = 1; i < 6; i++){
    conceptParents.push(
        {name: 'Parent ' + i, code: '49727002', roles: conceptRoles, parents: conceptParents, children: conceptChildren, descriptions: conceptDescriptions, active: true, historyVisible: true, feedbackVisible: true, feedback: '', memberEffectiveTime: '2020-01-15' },
    );
}


for (let i = 1; i < 6; i++){
    conceptChildren.push(
        {name: 'Child ' + i, type: ''}
    );
}

const conceptData = [
    { code: '49727002', roles: conceptRoles, parents: conceptParents, children: conceptChildren, descriptions: conceptDescriptions, active: true, historyVisible: true, feedbackVisible: true, feedback: '', memberStatus: true, memberEffectiveTime: '2020-01-15' },
    { code: '84229001', roles: conceptRoles, parents: conceptParents, children: conceptChildren, descriptions: conceptDescriptions, active: true, historyVisible: true, feedbackVisible: true, feedback: '', memberStatus: true, memberEffectiveTime: '2020-01-15' },
];

for (let i = 0; i < 300; i++){

    const descriptions = JSON.parse(JSON.stringify(conceptDescriptions));

    descriptions.forEach(description => {
        description.term += ' ' + i.toString();
    });

    let newConcept = { code: i.toString(), roles: conceptRoles, parents: conceptParents, children: conceptChildren, descriptions: descriptions, active: true, historyVisible: true, feedbackVisible: true, feedback: '', memberStatus: true, memberEffectiveTime: '2020-01-15' };

    if (i == 4 || i == 6) {
        newConcept.memberStatus = false;
    }

    conceptData.push(newConcept);
}

let fullyQualifiedLanguageRefsets = [
    {default: true, qualifiedLanguageRefset: '101PT', qualifiedLanguageCode: 'EN (PT)'},
    {default: false, qualifiedLanguageRefset: '101FSN', qualifiedLanguageCode: 'EN (FSN)'},
    {default: false, qualifiedLanguageRefset: '102PT', qualifiedLanguageCode: 'FR (PT)'},
    {default: false, qualifiedLanguageRefset: '103PT', qualifiedLanguageCode: 'NL (PT)'},
]

let versionList = [{ date: '2021-02-21', status: 'In Development' }, { date: '2021-01-31', status: 'Published' }, { date: '2020-07-31', status: 'Beta' }];

const refsetData = [
    { id: '1001', refsetId: '723264001', name: 'Lateralizable body structure reference set', editionName: 'US English', organizationName: 'SNOMED CT US', edition: {branch: 'MAIN', name: 'US', country: 'US', fullyQualifiedLanguageRefsets: fullyQualifiedLanguageRefsets}, organization: 'SNOMED INT', versionStatus: 'Published', versionNotes: 'Notes on refset 1 version', narrative: 'Narrative text on refset 1.', tags: ['blood', 'findings'], url: 'to be implemented', definition: '', versionDate: '2021-01-31', modified: '2020-01-15', active: true, type: 'extensional', privateRefset: false, downloadable: true, feedbackVisible: true, feedback: '', versionList: versionList },
    { id: '1002', refsetId: '723563008', name: 'MRCM module scope reference set', editionName: 'US English', organizationName: 'SNOMED CT US', edition: {branch: 'MAIN', name: 'US', country: 'US', fullyQualifiedLanguageRefsets: fullyQualifiedLanguageRefsets.slice(0, -2)}, organization: 'SNOMED INT', versionStatus: 'Published', versionNotes: 'Notes on refset 2 version', narrative: 'Narrative text on refset 2.', tags: ['disease', 'procedures'], url: 'to be implemented', definition: [{value: '< 12345', negated: false}, {clause: '< 98765', negated: true}], versionDate: '2021-01-31', modified: '2020-01-15', active: true, type: 'intensional', privateRefset: false, downloadable: false, feedbackVisible: true, feedback: '', versionList: versionList }
];

for (let i = 3; i < 306; i++){

    let newRefset = { id: (1000 + i).toString(), refsetId: (1000 + i).toString(), name: 'Refset ' + (1000 + i), editionName: 'US English', organizationName: 'SNOMED CT US', edition: {branch: 'MAIN', name: 'US', country: 'US', fullyQualifiedLanguageRefsets: fullyQualifiedLanguageRefsets}, organization: 'SNOMED INT', versionStatus: 'In Development', versionNotes: 'Notes on refset ' + (1000 + i) + ' version', narrative: 'Narrative text on refset ' + (1000 + i) + '.', tags: ['general surgery', 'outpatient'], url: 'to be implemented', definition: '', versionDate: '2021-01-31', modified: '2020-01-15', active: true, type: 'extensional', privateRefset: true, downloadable: true, feedbackVisible: true, feedback: '', versionList: versionList };
    
    if (i == 4 || i == 6) {
        newRefset.active = false;
    }
    
    refsetData.push(newRefset);
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
                    case url.includes('/taxonomyRoot') && method === 'GET':
                        return rootNode();
                    case url.match(/\/users\/\d+$/) && method === 'GET':
                        return getUserById();
                    default:
                        // pass through any requests not handled above
                        return next.handle(request); 
                }
            } else {
                
                switch (true) {
                    case url.includes('/taxonomyRoot') && method === 'GET':
                        return rootNode();
                    case url.includes('/members') && url.includes('taxonomy') && method === 'GET':
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

            if (params.displayType && params.displayType == 'taxonomy') {

                rowsThisPage = getTaxonomyConceptChildren(params.startingConceptId, params.depth);
            } else {
                rowsThisPage = sortAndFilter(conceptData);
            }

            //return ok(rowsThisPage);
            return ok({
                totalKnown: true,
                totalResults: totalResults,
                items: rowsThisPage
            });
        }

        function rootNode() {
            return ok(taxonomyRootNode);
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