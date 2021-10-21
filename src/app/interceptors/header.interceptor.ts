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

        request = request.clone({
            withCredentials: true
        });

        return next
            .handle(request).pipe(tap((event: HttpEvent<any>) => {
                    
                    // if (event instanceof HttpResponse) {
                    //     console.log('HttpResponse: ', event);
                    // }
                    
                    // else if (event instanceof HttpRequest) {
                    //     console.log('HttpRequest: ', event);
                    // }
                })
            );
    }
}
