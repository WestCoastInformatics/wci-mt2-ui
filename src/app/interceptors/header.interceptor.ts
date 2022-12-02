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
import { AuthenticationService } from 'src/app/services/authentication/authentication.service';

@Injectable()
export class HeaderInterceptor implements HttpInterceptor {


    constructor(private authService: AuthenticationService) {
    }

    intercept(request: HttpRequest<any>, next: HttpHandler): Observable<HttpEvent<any>> {
        if (!request.headers.has('Content-Type') && !request.headers.has('enctype')) {
            request = request.clone({
                headers: request.headers.set('Content-Type', 'application/json'),
            });
        }

        request = request.clone({
            withCredentials: true
        });

        const allCookies = document.cookie;

        if (!this.authService.isAuthenticated()) {
            this.authService.notAuthenticated();
        }
        this.authService.resetSession();

        return next
            .handle(request).pipe(tap((event: HttpEvent<any>) => {

            })
            );
    }
}
