import { Injectable } from '@angular/core';
import { CanActivate, ActivatedRouteSnapshot, RouterStateSnapshot, UrlTree } from '@angular/router';
import { Observable } from 'rxjs';
import {AuthenticationService} from './authentication.service';

@Injectable({
  providedIn: 'root'
})
export class AuthGuardGuard implements CanActivate {
  constructor(private authService: AuthenticationService) {}
  canActivate(
    route: ActivatedRouteSnapshot,
    state: RouterStateSnapshot): Observable<boolean | UrlTree> | Promise<boolean | UrlTree> | boolean | UrlTree {
      // const currentUser = localStorage.getItem('auth_token');
      const currentUser = document.cookie.split(';');
      console.log('currentUser', currentUser);
      if (currentUser.length > 1) {
          return true;
      } else {
          this.authService.notAuthenticated();
          return false;
      }
  }

}
