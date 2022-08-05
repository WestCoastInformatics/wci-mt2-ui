import {Directive, ElementRef, EventEmitter, HostBinding, HostListener, Output} from '@angular/core';

@Directive({
    selector: '[unfocus]'
})
export class FocusRemover {
    constructor(private elRef: ElementRef) {}

    @HostListener('click') onClick() {
        this.elRef.nativeElement.blur();
    }
}
