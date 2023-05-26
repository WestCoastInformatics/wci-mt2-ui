import { Component } from '@angular/core';
import { Toast, ToastrService, ToastPackage } from 'ngx-toastr';

export interface IToastButton {
	id: string;
	title: string;
	data?: any;
}

@Component({
	selector: '[app-notifiction]',
	templateUrl: 'notification.component.html',
})
export class NotificationComponent extends Toast {
	buttons: IToastButton[];
	refsetId: string;

	constructor(protected toastrService: ToastrService, public toastPackage: ToastPackage) {
		super(toastrService, toastPackage);
	}

	action(button: IToastButton) {
		this.toastPackage.triggerAction(button);
		return false;
	}
}
