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

        function getUserById() {
            if (!isLoggedIn()) return unauthorized();

            const user = userData.find(u => u.id === idFromUrl());
            return ok(user);
        }

        // helper functions
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