import { Injectable } from '@angular/core';
import { BehaviorSubject, Observable } from 'rxjs';

@Injectable({
	providedIn: 'root',
})
export class PersonalComponentService {
	public user = new BehaviorSubject<Array<any>>([]);

	public getUser(): Observable<{ user: [] }> {
		return <any>this.user;
	}

	public setUser(newUser) {
		this.user.next(newUser);
	}
}
