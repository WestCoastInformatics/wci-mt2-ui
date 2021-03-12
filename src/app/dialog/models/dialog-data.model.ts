import { TemplateRef } from '@angular/core';

export interface DialogData {
    headerText: string,
    template: TemplateRef<any>,
    data: any,
    confirmText?: string,
    cancelText?: string,
    showCancel?: boolean
}

export const DialogDataDefaults: DialogData = {
    headerText: 'Dialog',
    template: undefined,
    data: {},
    confirmText: 'OK',
    cancelText: 'Cancel',
    showCancel: true
}