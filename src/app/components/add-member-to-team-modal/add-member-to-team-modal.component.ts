import { Component, EventEmitter, Input, Output } from '@angular/core';
import { NgbModal, NgbModalRef } from '@ng-bootstrap/ng-bootstrap';
import { TeamsService } from 'src/app/services/rest/teams.service';
import { NotificationService } from 'src/app/services/notification.service';
import { CodeUtility } from 'src/app/utilities/code.utility';

@Component({
	standalone: false,
	selector: 'add-member-to-team-modal',
	templateUrl: './add-member-to-team-modal.component.html',
	styleUrls: ['add-member-to-team-modal.component.css'],
})
export class AddMemberToTeamModalComponent {
	emails = [];
	emailError = '';
	openedModel: NgbModalRef;
	showLoadingSpinner = false;

	@Input() id: string;
	@Input() name: string;
	@Input() users: any;
	@Output() changeLockedStatus = new EventEmitter<any>(true);
	firstLoad = true;

	constructor(private modalService: NgbModal, private teamsService: TeamsService, private notificationService: NotificationService) {}

	openAddMemberModal(addMemberModal: NgbModal) {
		this.firstLoad = true;
		this.emails = [];
		this.openedModel = this.modalService.open(addMemberModal, { backdrop: 'static', keyboard: false });
	}

	addUsersToTeam(): void {
		let usersToAdd = '';
		if (CodeUtility.hasValue(this.emails)) {
			usersToAdd = this.emails.join(';');
		}
		if (!CodeUtility.hasValue(usersToAdd)) {
			return;
		}

		this.changeLockedStatus.emit(true);

		const operation = this.teamsService.addUsers.bind(this.teamsService);

		operation(this.id, usersToAdd).subscribe(
			(data) => {
				this.notificationService.show('The user(s) added.', null, 'success', { timeOut: 0, extendedTimeOut: 0 });
				this.openedModel.dismiss();
				this.changeLockedStatus.emit(false);
				window.location.reload();
			},
			(err) => {
				this.changeLockedStatus.emit(false);
				console.error(err);
			}
		);
	}
}
