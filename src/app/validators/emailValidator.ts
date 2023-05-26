import { AbstractControl, ValidatorFn } from '@angular/forms';

export function emailValidator(): ValidatorFn {
	return (control: AbstractControl): { [key: string]: boolean } | null => {
		/* eslint-disable no-useless-escape */
		if (control.value && !control.value.match(/^[\w-\.]+@([\w-]+\.)+[\w-]{2,4}$/g)) {
			return { email: true };
		}
		return null;
	};
}
