import { Injectable } from '@angular/core';
import { BehaviorSubject, Observable } from 'rxjs';

@Injectable({
	providedIn: 'root',
})
export class MT2Service {
	public moduleMetadata = new BehaviorSubject<Array<any>>([]);

	public getModuleMetadata(): Observable<{ moduleMetadata: [] }> {
		return <any>this.moduleMetadata;
	}

	public setModuleMetadata(list) {
		this.moduleMetadata.next(list);
	}
}
