import { Injectable, SecurityContext } from '@angular/core';
import { ActiveToast, ToastrService } from 'ngx-toastr';
import { DomSanitizer } from '@angular/platform-browser';
import { IToastButton } from '../components/notification/notification.component';

@Injectable({
	providedIn: 'root',
})
export class NotificationService {
	constructor(
		private toastr: ToastrService,
		private readonly sanitizer: DomSanitizer,
	) {}

	show(message: string, title: string = null, type = 'info', config: any = {}, mapsetId = '', buttons: IToastButton[] = []): ActiveToast<any> {
		const additonalConfig = {
			timeOut: 25000,
			enableHtml: true,
			tapToDismiss: false,
			closeButton: true,
			toastClass: 'mt2-notification',
		};

		const toast = this.toastr.show(message, title, { ...additonalConfig, ...config }, 'toast-' + type);
		toast.toastRef.componentInstance.refsetId = mapsetId;

		if (buttons.length > 0) {
			toast.toastRef.componentInstance.buttons = buttons;
		}

		return toast;
	}

	showProgress(
		message: string,
		title: string = null,
		progressFn: () => number = null,
		config: any = {},
		mapsetId = '',
		buttons: IToastButton[] = [],
	): ActiveToast<any> {
		const additonalConfig = {
			extendedTimeOut: 0,
			timeOut: 100000000, // we need to set a timeout otherwise ngx-toastr won't display the progressBar
			enableHtml: true,
			tapToDismiss: false,
			progressBar: true,
			progressAnimation: 'increasing',
		};

		const toast = this.show(message, title, 'info', { ...additonalConfig, ...config }, mapsetId, buttons);

		this.setProgressLength(toast, 0);
		return toast;
	}

	update(toast: ActiveToast<any>, message: string = null, title: string = null, type: string = null, options: any = null, progress: number = null) {
		if (message != null) {
			toast.toastRef.componentInstance.message = message; //this.sanitizeString(message);
		}

		if (title != null) {
			toast.toastRef.componentInstance.title = title;
		}

		if (type != null) {
			toast.toastRef.componentInstance.type = type;
		}

		if (options != null) {
			toast.toastRef.componentInstance.options = { ...toast.toastRef.componentInstance.options, ...options };
		}

		// if (options != null && options['closeButton'] != null) {
		//     toast.toastRef.componentInstance.closeButton = options.closeButton;
		// }

		if (progress != null) {
			this.setProgressLength(toast, progress);
		}

		toast.portal.changeDetectorRef.detectChanges();
	}

	close(toast: ActiveToast<any>) {
		toast.toastRef.close();
		toast.toastRef.componentInstance.remove();
	}

	closeAll() {
		this.toastr.clear();
	}

	isOpen(toast: ActiveToast<any>) {
		return toast.toastRef.componentInstance.state.value != 'removed';
	}

	sanitizeUrl(url) {
		return this.sanitizer.bypassSecurityTrustResourceUrl(url);
	}

	sanitizeString(text) {
		return this.sanitizer.sanitize(SecurityContext.HTML, this.sanitizer.bypassSecurityTrustHtml(text));
	}

	handleDuplicates(type = 'error', message = '', consolidate = false) {
		const allToasts: ActiveToast<any>[] = this.toastr.toasts;
		const toastInstances: ActiveToast<any>[] = [];
		let consolidatedMessage = '';

		for (let i = 0; i < allToasts.length; i++) {
			const toast = allToasts[i];
			const instance = toast.toastRef.componentInstance;

			if (instance.toastClasses.includes(type)) {
				toastInstances.push(toast);
			}
		}

		if (toastInstances.length <= 1) {
			return;
		}

		for (let i = 0; i < toastInstances.length; i++) {
			const toast = toastInstances[i];
			const instance = toast.toastRef.componentInstance;

			if (consolidatedMessage == '') {
				consolidatedMessage = i + 1 + ': ' + instance.message;
			} else if (instance.message != message && instance.message.includes(message)) {
				consolidatedMessage += '<br>' + (i + 1) + ': ' + instance.message;
			}

			toast.toastRef.close();
			instance.remove();
		}

		if (!consolidate) {
			consolidatedMessage = message;
		}

		const newToast = this.show(consolidatedMessage, null, type, { timeOut: 0, extendedTimeOut: 0 });
		return newToast;
	}

	getNotificationsForRefset(mapsetId: string, title: string) {
		const allToasts: ActiveToast<any>[] = this.toastr.toasts;
		const toastInstances: ActiveToast<any>[] = [];

		for (let i = 0; i < allToasts.length; i++) {
			const toast = allToasts[i];
			const instance = toast.toastRef.componentInstance;

			if (instance.refsetId == mapsetId && toast.title == title) {
				toastInstances.push(toast);
			}
		}

		return toastInstances;
	}

	isNotificationOfType(toast: ActiveToast<any>, type: string) {
		return toast.toastRef.componentInstance.toastClasses.includes(type);
	}

	private setProgressLength(toast: ActiveToast<any>, progress: number) {
		// A bit "hacky", the ngx-toastr progress bar only works with its own progress method, based on the specified timeout, and cannot be controlled manually
		// That's why we have to specify a big timeout in the options
		// We overload the default progress method to use the one we want, this way, we can have a manual control of the progress bar
		(<any>toast).toastRef.componentInstance.updateProgress = () => {
			(<any>toast).toastRef.componentInstance.width = progress; //progressFn();
		};
	}
}
