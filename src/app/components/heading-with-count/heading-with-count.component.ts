import { Component, Input } from '@angular/core';

@Component({
	standalone: false,
	selector: 'heading-with-count',
	templateUrl: './heading-with-count.component.html',
	styleUrls: ['./heading-with-count.component.css'],
})
export class HeadingWithCountComponent {
	@Input() title: string;
	@Input() count?: number;
	@Input() classname: string;
	@Input() showcount?: boolean;

	constructor() {}
}
