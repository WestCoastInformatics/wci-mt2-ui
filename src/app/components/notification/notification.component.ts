import { Component, Input } from "@angular/core";
import { Toast, ToastrService, ToastPackage } from "ngx-toastr";

@Component({
    selector: "[app-notifiction]",
    templateUrl: "notification.component.html"
})

export class NotificationComponent extends Toast {

    constructor(protected toastrService: ToastrService, public toastPackage: ToastPackage) {
        super(toastrService, toastPackage);
    }
}