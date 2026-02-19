import { Component, OnInit, Input } from '@angular/core';

@Component({
	standalone: false,
	selector: 'app-progress',
	templateUrl: './progress.component.html',
	styleUrls: ['progress.component.css'],
})
export class ProgressComponent implements OnInit {
	@Input() progress = 0;
	constructor() {}

	ngOnInit() {}
}
