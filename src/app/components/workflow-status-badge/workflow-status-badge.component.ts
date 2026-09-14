import { Component, Input } from '@angular/core';

@Component({
	standalone: false,
	selector: 'workflow-status-badge',
	templateUrl: './workflow-status-badge.component.html',
	styleUrls: ['workflow-status-badge.component.css'],
})
export class WorkflowStatusBadgeComponent {
	@Input() status: any;
	@Input() table = false;

	constructor() {}
}
