import { Component, Input, OnChanges } from '@angular/core';
import { CodeUtility } from 'src/app/utilities/code.utility';

@Component({
	standalone: false,
	selector: 'app-workflow-status',
	templateUrl: './workflow-status.component.html',
	styleUrls: ['./workflow-status.component.css'],
})
export class WorkflowStatusComponent implements OnChanges {
	stepperInfo: any = {};
	stepperStartInfo = {
		READY_FOR_EDIT_COLOR: 'details-page-stepper-unstarted-step',
		READY_FOR_EDIT_STARTED: false,
		IN_EDIT_COLOR: 'details-page-stepper-unstarted-step',
		IN_EDIT_STARTED: false,
		READY_FOR_REVIEW_COLOR: 'details-page-stepper-unstarted-step',
		READY_FOR_REVIEW_STARTED: false,
		IN_REVIEW_COLOR: 'details-page-stepper-unstarted-step',
		IN_REVIEW_STARTED: false,
		REVIEW_COMPLETED_COLOR: 'details-page-stepper-unstarted-step',
		REVIEW_COMPLETED_STARTED: false,
		READY_FOR_PUBLICATION_COLOR: 'details-page-stepper-unstarted-step',
		READY_FOR_PUBLICATION_STARTED: false,
	};
	@Input() workflowStatus;

	constructor() {}

	ngOnChanges() {
		const stepperClass = 'details-page-stepper-started-step';
		this.stepperInfo = CodeUtility.clone(this.stepperStartInfo);
		if (this.workflowStatus !== undefined) {
			switch (this.workflowStatus) {
				case 'READY_FOR_EDIT':
					this.stepperInfo['READY_FOR_EDIT_COLOR'] = stepperClass;
					this.stepperInfo['READY_FOR_EDIT_STARTED'] = true;
					break;
				case 'IN_EDIT':
					this.stepperInfo['READY_FOR_EDIT_COLOR'] = stepperClass;
					this.stepperInfo['READY_FOR_EDIT_STARTED'] = true;
					this.stepperInfo['IN_EDIT_COLOR'] = stepperClass;
					this.stepperInfo['IN_EDIT_STARTED'] = true;
					break;
				case 'READY_FOR_REVIEW':
					this.stepperInfo['READY_FOR_EDIT_COLOR'] = stepperClass;
					this.stepperInfo['READY_FOR_EDIT_STARTED'] = true;
					this.stepperInfo['IN_EDIT_COLOR'] = stepperClass;
					this.stepperInfo['IN_EDIT_STARTED'] = true;
					this.stepperInfo['READY_FOR_REVIEW_COLOR'] = stepperClass;
					this.stepperInfo['READY_FOR_REVIEW_STARTED'] = true;
					break;
				case 'IN_REVIEW':
					this.stepperInfo['READY_FOR_EDIT_COLOR'] = stepperClass;
					this.stepperInfo['READY_FOR_EDIT_STARTED'] = true;
					this.stepperInfo['IN_EDIT_COLOR'] = stepperClass;
					this.stepperInfo['IN_EDIT_STARTED'] = true;
					this.stepperInfo['READY_FOR_REVIEW_COLOR'] = stepperClass;
					this.stepperInfo['READY_FOR_REVIEW_STARTED'] = true;
					this.stepperInfo['IN_REVIEW_COLOR'] = stepperClass;
					this.stepperInfo['IN_REVIEW_STARTED'] = true;
					break;
				case 'REVIEW_COMPLETED':
					this.stepperInfo['READY_FOR_EDIT_COLOR'] = stepperClass;
					this.stepperInfo['READY_FOR_EDIT_STARTED'] = true;
					this.stepperInfo['IN_EDIT_COLOR'] = stepperClass;
					this.stepperInfo['IN_EDIT_STARTED'] = true;
					this.stepperInfo['READY_FOR_REVIEW_COLOR'] = stepperClass;
					this.stepperInfo['READY_FOR_REVIEW_STARTED'] = true;
					this.stepperInfo['IN_REVIEW_COLOR'] = stepperClass;
					this.stepperInfo['IN_REVIEW_STARTED'] = true;
					this.stepperInfo['REVIEW_COMPLETED_COLOR'] = stepperClass;
					this.stepperInfo['REVIEW_COMPLETED_STARTED'] = true;
					break;
				case 'READY_FOR_PUBLICATION':
					this.stepperInfo['READY_FOR_EDIT_COLOR'] = stepperClass;
					this.stepperInfo['READY_FOR_EDIT_STARTED'] = true;
					this.stepperInfo['IN_EDIT_COLOR'] = stepperClass;
					this.stepperInfo['IN_EDIT_STARTED'] = true;
					this.stepperInfo['READY_FOR_REVIEW_COLOR'] = stepperClass;
					this.stepperInfo['READY_FOR_REVIEW_STARTED'] = true;
					this.stepperInfo['IN_REVIEW_COLOR'] = stepperClass;
					this.stepperInfo['IN_REVIEW_STARTED'] = true;
					this.stepperInfo['REVIEW_COMPLETED_COLOR'] = stepperClass;
					this.stepperInfo['REVIEW_COMPLETED_STARTED'] = true;
					this.stepperInfo['READY_FOR_PUBLICATION_COLOR'] = stepperClass;
					this.stepperInfo['READY_FOR_PUBLICATION_STARTED'] = true;
					break;
				case 'IN_UPGRADE':
					//none
					break;
				case 'IN_PUBLICATION':
					this.stepperInfo['READY_FOR_EDIT_COLOR'] = stepperClass;
					this.stepperInfo['READY_FOR_EDIT_STARTED'] = true;
					this.stepperInfo['IN_EDIT_COLOR'] = stepperClass;
					this.stepperInfo['IN_EDIT_STARTED'] = true;
					this.stepperInfo['READY_FOR_REVIEW_COLOR'] = stepperClass;
					this.stepperInfo['READY_FOR_REVIEW_STARTED'] = true;
					this.stepperInfo['IN_REVIEW_COLOR'] = stepperClass;
					this.stepperInfo['IN_REVIEW_STARTED'] = true;
					this.stepperInfo['REVIEW_COMPLETED_COLOR'] = stepperClass;
					this.stepperInfo['REVIEW_COMPLETED_STARTED'] = true;
					this.stepperInfo['READY_FOR_PUBLICATION_COLOR'] = stepperClass;
					this.stepperInfo['READY_FOR_PUBLICATION_STARTED'] = true;
					break;
				case 'PUBLISHED':
					this.stepperInfo['READY_FOR_EDIT_COLOR'] = stepperClass;
					this.stepperInfo['READY_FOR_EDIT_STARTED'] = true;
					this.stepperInfo['IN_EDIT_COLOR'] = stepperClass;
					this.stepperInfo['IN_EDIT_STARTED'] = true;
					this.stepperInfo['READY_FOR_REVIEW_COLOR'] = stepperClass;
					this.stepperInfo['READY_FOR_REVIEW_STARTED'] = true;
					this.stepperInfo['IN_REVIEW_COLOR'] = stepperClass;
					this.stepperInfo['IN_REVIEW_STARTED'] = true;
					this.stepperInfo['REVIEW_COMPLETED_COLOR'] = stepperClass;
					this.stepperInfo['REVIEW_COMPLETED_STARTED'] = true;
					this.stepperInfo['READY_FOR_PUBLICATION_COLOR'] = stepperClass;
					this.stepperInfo['READY_FOR_PUBLICATION_STARTED'] = true;
					break;
				default: //null
					this.stepperInfo['READY_FOR_EDIT_COLOR'] = stepperClass;
					this.stepperInfo['READY_FOR_EDIT_STARTED'] = true;
					break;
			}
		}
	}
}
