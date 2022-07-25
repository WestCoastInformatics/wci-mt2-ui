import { DOCUMENT } from '@angular/common';
import { Component, OnInit, Inject, HostListener } from '@angular/core';

@Component({
    selector: 'scroll-top',
    templateUrl: './scroll-top.component.html'
})
export class ScrollTopComponent implements OnInit {
    windowScrolled: boolean;
    constructor(@Inject(DOCUMENT) private document: Document) {}
    @HostListener('window:scroll', [])
    onWindowScroll() {
        if (document.documentElement.scrollTop > 130) {
            this.windowScrolled = true;
        } else if (this.windowScrolled && document.documentElement.scrollTop < 10) {
            this.windowScrolled = false;
        }
    }
    scrollToTop() {
        (function smoothscroll() {
            const currentScroll = document.documentElement.scrollTop;
            if (currentScroll > 130) {
                window.requestAnimationFrame(smoothscroll);
                window.scrollTo(0, 130);
            }
        })();
    }
    ngOnInit() {}
}
