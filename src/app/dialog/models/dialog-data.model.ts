import { TemplateRef } from '@angular/core';

export interface DialogData {
    headerText?: string;
    template: TemplateRef<any>;
    actionTemplate?: TemplateRef<any>;
    data: any;
    confirmText?: string;
    confirmIcon?: string;
    cancelText?: string;
    cancelIcon?: string;
    showCancel?: boolean;
    showTitle?: boolean;
    showCloseIcon?: boolean;
}

export const DialogDataDefaults: DialogData = {
    headerText: 'Dialog',
    template: undefined,
    actionTemplate: undefined,
    data: {},
    confirmText: 'OK',
    confirmIcon: undefined,
    cancelText: 'Cancel',
    cancelIcon: undefined,
    showCancel: true,
    showTitle: true,
    showCloseIcon: true
}