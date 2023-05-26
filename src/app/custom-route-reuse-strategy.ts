import { LocationStrategy } from '@angular/common';
import { Injectable } from '@angular/core';
import { RouteReuseStrategy, DetachedRouteHandle, ActivatedRouteSnapshot } from '@angular/router';
import { BreadcrumbService } from './services/breadcrumb.service';

@Injectable()
export class CustomReuseStrategy implements RouteReuseStrategy {
	handlers: { [key: string]: DetachedRouteHandle } = {};
	back = false;
	previousBreadcrumbLabel: any;

	constructor(location: LocationStrategy, private breadcrumbService: BreadcrumbService) {
		location.onPopState(() => {
			this.back = true;
		});
	}

	calcKey(route: ActivatedRouteSnapshot) {
		let next = route;
		let url = '';
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
		const url = route.url.join('/') || route.parent.url.join('/');
		this.previousBreadcrumbLabel = route.data?.breadcrumbLabel;
		this.handlers[url] = handle;
	}

	shouldAttach(route: ActivatedRouteSnapshot): boolean {
		const url = route.url.join('/') || route.parent.url.join('/');
		this.setBreadcrumbs(route);
		if (this.back && url !== 'projects') {
			this.back = false;
			return !!route.routeConfig && !!this.handlers[url];
		}

		return;
	}

	retrieve(route: ActivatedRouteSnapshot): DetachedRouteHandle {
		const url = route.url.join('/') || route.parent.url.join('/');

		if (!route.routeConfig) return null;
		return this.handlers[url];
	}

	shouldReuseRoute(future: ActivatedRouteSnapshot, curr: ActivatedRouteSnapshot): boolean {
		return future.routeConfig === curr.routeConfig;
	}

	private setBreadcrumbs(route: ActivatedRouteSnapshot): void {
		if (route.url[0]) {
			if (this.previousBreadcrumbLabel != null && route.url[0].path === 'details' && this.previousBreadcrumbLabel.includes('Reference Set Library')) {
				this.breadcrumbService.setBreadcrumbs([{ path: '/library', label: 'Reference Set Library' }, { label: 'Reference Set Details' }]);
			} else if (this.previousBreadcrumbLabel != null && route.url[0].path === 'details' && this.previousBreadcrumbLabel.includes('Projects')) {
				this.breadcrumbService.setBreadcrumbs([{ path: '/projects', label: 'Projects' }, { label: 'Reference Set Details' }]);
			} else {
				this.breadcrumbService.setBreadcrumbs([{ label: route.data['breadcrumbLabel'] }]);
			}
		}
	}
}
