import { Component, EventEmitter, Input, Output } from '@angular/core';
import { NgbModal, NgbModalRef } from '@ng-bootstrap/ng-bootstrap';
import { NotificationService } from 'src/app/services/notification.service';
import { CodeUtility } from 'src/app/utilities/code.utility';
import { ProjectsService } from 'src/app/services/rest/projects.service';

@Component({
	standalone: false,
	selector: 'create-new-project-modal',
	templateUrl: './create-new-project-modal.component.html',
	styleUrls: ['create-new-project-modal.component.scss'],
})
export class CreateNewProjectModalComponent {
	// Project artifact Variables for Navigation to resource page after project creation
	selectedProject: any;
	isSelectedProject: boolean;
	projectId: any;

	// Create New Project Modal Variables
	name = '';
	email = '';
	description = '';
	openedModel: NgbModalRef;
	privateProject: any;
	emailError = '';

	@Input() edition: any;
	@Output() changeLockedStatus = new EventEmitter<any>(true);
	firstLoad = true;

	constructor(private modalService: NgbModal, private projectsService: ProjectsService, private notificationService: NotificationService) {}

	setAutoFocus(focusElement: any) {
		if (this.firstLoad) {
			focusElement.focus();
			this.firstLoad = false;
		}
	}

	openCreateNewProjectModal(createNewProjectDialog: NgbModal) {
		this.firstLoad = true;

		if (CodeUtility.hasValue(this.edition)) {
			this.description = '';
			this.openedModel = this.modalService.open(createNewProjectDialog, { backdrop: 'static', keyboard: false });
		}
	}

	isValidEmail(): boolean {
		if (this.email.length == 0) {
			return true;
		}
		const lower = this.email.toLowerCase();
		const flag = lower.match(/^(([^<>()[\]\\.,;:\s@"]+(\.[^<>()[\]\\.,;:\s@"]+)*)|(".+"))@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\])|(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,}))$/);

		if (flag == null) {
			this.emailError = 'Email is invalid.';
		} else {
			this.emailError = '';
		}

		return flag == null ? false : true;
	}

	onKeyDownEvent(event: any) {
		this.isValidEmail();
	}

	createProjectObject(): void {
		this.changeLockedStatus.emit(true);

		const params: any = {
			active: true,
			name: this.name,
			description: this.description,
			//primaryContactEmail: this.email,
			privateProject: this.privateProject,
			teams: [],
			edition: this.edition,
		};

		this.projectsService.createProject(params).subscribe(
			(data) => {
				this.notificationService.show('The Project is created.', null, 'success', { timeOut: 0, extendedTimeOut: 0 });
				this.modalService.dismissAll();
				this.changeLockedStatus.emit(false);
				window.location.reload();
			},
			(err) => {
				this.changeLockedStatus.emit(false);
			}
		);
	}
}
