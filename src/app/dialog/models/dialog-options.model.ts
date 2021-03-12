export interface DialogOptions {
    width?: string;
    disableClose?: boolean;
    id?: string;
}

export const DialogOptionDefaults: DialogOptions = {
    width: '500px',
    disableClose: true,
    id: 'refesetToolDialog'
}