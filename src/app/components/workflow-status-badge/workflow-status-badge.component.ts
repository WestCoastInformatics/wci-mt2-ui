import { Component, Input } from '@angular/core';

@Component({
	selector: 'workflow-status-badge',
	templateUrl: './workflow-status-badge.component.html',
	styleUrls: ['workflow-status-badge.component.scss']
})
export class WorkflowStatusBadgeComponent {
	@Input() status: any;
	constructor() { }
}
