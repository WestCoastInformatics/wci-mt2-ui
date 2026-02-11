import { Directive, ElementRef, HostListener } from '@angular/core';

@Directive({
	standalone: false,
	selector: '[unfocus]',
})
export class FocusRemover {
	constructor(private elRef: ElementRef) {}

	@HostListener('click') onClick() {
		this.elRef.nativeElement.blur();
	}
}
