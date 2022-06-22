import { Component, Input } from '@angular/core';

@Component({
	selector: 'workflow-status-badge',
	templateUrl: './workflow-status-badge.component.html'
})
export class WorkflowStatusBadgeComponent {
	@Input() status: any;
	constructor() { }
}
