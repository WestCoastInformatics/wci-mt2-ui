import { Injectable } from '@angular/core';

@Injectable({
	providedIn: 'root',
})
export class ToggleService {
	isToggled = false;

	constructor() {}

	toggleSidebar(): void {
		if (!this.isToggled) {
			this.isToggled = true;
		} else {
			this.isToggled = false;
		}
	}
}
