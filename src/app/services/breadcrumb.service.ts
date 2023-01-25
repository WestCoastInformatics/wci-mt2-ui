import { Injectable } from "@angular/core";
import { BehaviorSubject, Observable } from "rxjs";

@Injectable({
  providedIn: 'root'
})
export class BreadcrumbService {

  breadcrumbs = new BehaviorSubject<any>([]);
  observable$: Observable<any> = this.breadcrumbs.asObservable();

  constructor() {
  }

  getBreadcrumbs() {

    return this.observable$;
  }

  setBreadcrumbs(breadcrumbs) {

    let breadcrumbNav = [];
    let i = 0;

    for (let breadcrumb of breadcrumbs) {

      breadcrumb.id = i;
      breadcrumb.class = 'rt2-breadcrumb';

      if (breadcrumb.path != undefined) {

        breadcrumb.selectable = true;
        breadcrumb.class += ' rt2-breadcrumb-selectable';
      }

      breadcrumbNav.push(breadcrumb);
      i++;
    }

    this.breadcrumbs.next(breadcrumbNav);
  }

}