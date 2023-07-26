import { Injectable } from '@angular/core';
import { BehaviorSubject, Observable } from 'rxjs';

@Injectable({
	providedIn: 'root',
})
export class TeamsComponentService {
	public organizationList = new BehaviorSubject<Array<any>>([]);
	public teamsList = new BehaviorSubject<Array<any>>([]);

	public getOrganizations(): Observable<{ organizationList: [] }> {
		return <any>this.organizationList;
	}

	public setOrganizations(list) {
		this.organizationList.next(list);
	}

	public getTeams(): Observable<{ teamsList: [] }> {
		return <any>this.teamsList;
	}

	public setTeams(list) {
		this.teamsList.next(list);
	}
}
