import { LocationStrategy } from '@angular/common';
import { Injectable } from '@angular/core';
import { RouteReuseStrategy, DetachedRouteHandle, ActivatedRouteSnapshot } from '@angular/router';

@Injectable()
export class CustomReuseStrategy implements RouteReuseStrategy {

    handlers: { [key: string]: DetachedRouteHandle } = {};
    back = false;

    constructor(location: LocationStrategy) {
        location.onPopState(() => {
            this.back = true;
        });
    }

  calcKey(route: ActivatedRouteSnapshot) {
    let next = route;
    let url = "";
    while (next) {
      if (next.url) {
        url = next.url.join('/');
      }
      next = next.firstChild;
    }
    return url;
  }

  shouldDetach(route: ActivatedRouteSnapshot): boolean {
    return true;
  }

  store(route: ActivatedRouteSnapshot, handle: DetachedRouteHandle): void {
    let url = route.url.join("/") || route.parent.url.join("/");

    this.handlers[url] = handle;

  }

  shouldAttach(route: ActivatedRouteSnapshot): boolean {
    let url = route.url.join("/") || route.parent.url.join("/");
      if (this.back && url !== 'projects') {
          this.back = false;
        return !!route.routeConfig && !!this.handlers[url];
      }

      return;
  }

  retrieve(route: ActivatedRouteSnapshot): DetachedRouteHandle {
    let url = route.url.join("/") || route.parent.url.join("/");
    
    if (!route.routeConfig) return null;
    return this.handlers[url];
  }

  shouldReuseRoute(future: ActivatedRouteSnapshot, curr: ActivatedRouteSnapshot): boolean {
    return future.routeConfig === curr.routeConfig;
  }
}