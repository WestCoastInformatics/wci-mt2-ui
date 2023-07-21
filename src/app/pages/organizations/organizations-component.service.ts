import { Injectable } from '@angular/core';
import { BehaviorSubject, Observable } from 'rxjs';

@Injectable({
	providedIn: 'root',
})
export class OrganizationsComponentService {
	public organizationList = new BehaviorSubject<Array<any>>([]);
	public editionList = new BehaviorSubject<Array<any>>([]);

	public getOrganizations(): Observable<{ organizationList: [] }> {
		return <any>this.organizationList;
	}

	public setOrganizations(list) {
		this.organizationList.next(list);
	}

	public getEditions(): Observable<{ editionList: [] }> {
		return <any>this.editionList;
	}

	public setEditions(list) {
		this.editionList.next(list);
	}
}
