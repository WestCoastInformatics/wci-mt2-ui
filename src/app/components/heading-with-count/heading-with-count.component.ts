import { Component, Input } from '@angular/core';

@Component({
    selector: 'heading-with-count',
    templateUrl: './heading-with-count.component.html',
    styleUrls: ['./heading-with-count.component.scss']
})
export class HeadingWithCountComponent {

    @Input() title: string;
    @Input() count?: number;
    @Input() classname: string;
    @Input() showcount?: boolean;

    constructor() {}

}
