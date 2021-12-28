import { Injectable, SecurityContext } from '@angular/core';
import { ActiveToast, ToastrService } from 'ngx-toastr';
import { DomSanitizer, SafeResourceUrl } from "@angular/platform-browser";
import { IToastButton } from '../components/notification/notification.component';

@Injectable({
    providedIn: 'root'
})

export class NotificationService {

    constructor(
        private toastr: ToastrService,
        private readonly sanitizer: DomSanitizer
    ) { }

    show(message: string, title: string = null, type: string = 'info', config: any = {}, buttons: IToastButton[] = []): ActiveToast<any> {

        let additonalConfig = {
            'timeOut': 25000,
            'enableHtml': true,
            'tapToDismiss': false,
            'closeButton': true,
        };

        const toast = this.toastr.show(message, title, {...additonalConfig, ...config}, 'toast-' + type);

        if (buttons.length > 0) {
            toast.toastRef.componentInstance.buttons = buttons;
        }
        
        return toast;
    }

    showProgress(message: string, title: string = null, progressFn: () => number = null, config: any = {}, buttons: IToastButton[] = []): ActiveToast<any> {

        let additonalConfig = {
            'extendedTimeOut': 0,
            'timeOut': 100000000, // we need to set a timeout otherwise ngx-toastr won't display the progressBar
            'enableHtml': true,
            'tapToDismiss': false,
            'progressBar': true,
            'progressAnimation': 'increasing'
        };

        const toast = this.show(message, title, 'info', {...additonalConfig, ...config}, buttons);

        this.setProgressLength(toast, 0);
        return toast;
    }

    update(toast: ActiveToast<any>, message: string = null, title: string = null, type: string = null, options: any = null, progress: number = null){

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
            toast.toastRef.componentInstance.options = {...toast.toastRef.componentInstance.options, ...options};
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

    isOpen(toast: ActiveToast<any>) {
        return toast.toastRef.componentInstance.state.value != 'removed';
    }

    sanitizeUrl(url) {
        return this.sanitizer.bypassSecurityTrustResourceUrl(url);
    }

    sanitizeString(text) {
        return this.sanitizer.sanitize(SecurityContext.HTML, this.sanitizer.bypassSecurityTrustHtml(text));
    }



    private setProgressLength(toast: ActiveToast<any>, progress: number) {
        
        // A bit "hacky", the ngx-toastr progress bar only works with its own progress method, based on the specified timeout, and cannot be controlled manually
        // That's why we have to specify a big timeout in the options
        // We overload the default progress method to use the one we want, this way, we can have a manual control of the progress bar
        (<any>toast).toastRef.componentInstance.updateProgress= () => {
            (<any>toast).toastRef.componentInstance.width = progress; //progressFn();
        };
    }
}