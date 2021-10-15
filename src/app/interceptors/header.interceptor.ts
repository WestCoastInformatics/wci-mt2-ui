import {
    HttpEvent,
    HttpHandler,
    HttpInterceptor,
    HttpRequest,
    HttpResponse,
} from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { tap } from 'rxjs/operators';

@Injectable()
export class HeaderInterceptor implements HttpInterceptor {
    constructor() {
    }

    intercept(request: HttpRequest<any>, next: HttpHandler): Observable<HttpEvent<any>> {

        if (!request.headers.has('Content-Type')) {
            request = request.clone({
                headers: request.headers.set('Content-Type', 'application/json'),
            });
        }

        console.log("outgoing request", request);
        request = request.clone({
            withCredentials: true
        });
        console.log("new outgoing request", request);

        return next
            .handle(request).pipe(
                tap((ev: HttpEvent<any>) => {
                    console.log("got an event", ev)
                    if (ev instanceof HttpResponse) {
                        console.log('event of type response', ev);
                    }
                })
            );
    }
}
