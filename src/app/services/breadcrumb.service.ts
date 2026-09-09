import { Injectable } from '@angular/core';
import { BehaviorSubject, Observable } from 'rxjs';

@Injectable({
	providedIn: 'root',
})
export class BreadcrumbService {
	breadcrumbs = new BehaviorSubject<any>([]);
	observable$: Observable<any> = this.breadcrumbs.asObservable();

	constructor() {}

	getBreadcrumbs() {
		return this.observable$;
	}

	setBreadcrumbs(breadcrumbs) {
		const breadcrumbNav = [];
		let i = 0;

		for (const breadcrumb of breadcrumbs) {
			breadcrumb.id = i;
			breadcrumb.class = 'mt2-breadcrumb';

			if (breadcrumb.path != undefined) {
				breadcrumb.selectable = true;
				breadcrumb.class += ' mt2-breadcrumb-selectable';
			}

			breadcrumbNav.push(breadcrumb);
			i++;
		}

		this.breadcrumbs.next(breadcrumbNav);
	}
}
