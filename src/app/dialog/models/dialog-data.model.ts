import { TemplateRef } from '@angular/core';

export interface DialogData {
	headerText?: string;
	template: TemplateRef<any>;
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
	data: {},
	confirmText: 'Yes',
	confirmIcon: undefined,
	cancelText: 'No',
	cancelIcon: undefined,
	showCancel: true,
	showTitle: true,
	showCloseIcon: true,
};
