import { Component, EventEmitter, Input, Output } from '@angular/core';
import { NgbModal, NgbModalRef } from '@ng-bootstrap/ng-bootstrap';
import { TeamsService } from 'src/app/services/rest/teams.service';
import { NotificationService } from 'src/app/services/notification.service';
import { RefsetDetails } from 'src/app/pages/refset-details';
import { CodeUtility } from 'src/app/utilities/code.utility';

@Component({
	selector: 'create-new-team-modal',
	templateUrl: './create-new-team-modal.component.html',
})
export class CreateNewTeamModalComponent {
	name = '';
	email = '';
	description = '';
	openedModel: NgbModalRef;
	privateTeam: any;
	selectedRoles: any;
	members: any;
	refsetUser: any;
	roleOptions: any;
	emailError = '';
	param: any;

	@Input() organization: any;
	@Output() changeLockedStatus = new EventEmitter<any>(true);
	firstLoad = true;

	constructor(private modalService: NgbModal, private teamsService: TeamsService, private notificationService: NotificationService, private readonly refsetDetails: RefsetDetails) {}

	ngOnInit() {
		this.roleOptions = [
			{ value: 'AUTHOR', display: 'Author' },
			{ value: 'REVIEWER', display: 'Reviewer' },
			{ value: 'ADMIN', display: 'Admin' },
			{ value: 'VIEWER', display: 'Viewer' },
		];

		try {
			this.refsetUser = JSON.parse(sessionStorage.getItem('refset_user'));
		} catch (ex) {
			return null;
		}
	}

	setAutoFocus(focusElement: any) {
		if (this.firstLoad) {
			focusElement.focus();
			this.firstLoad = false;
		}
	}

	openCreateNewTeamModal(createNewTeamDialog: NgbModal) {
		this.firstLoad = true;

		this.selectedRoles = [];
		this.description = '';

		this.openedModel = this.modalService.open(createNewTeamDialog, { backdrop: 'static', keyboard: false });
	}

	callMemberOperation(): void {
		if (!CodeUtility.hasValue(this.description)) {
			return;
		}

		this.changeLockedStatus.emit(true);

		this.createTeamObject();

		//UiUtility.manageNotifications(this.refsetInternalId, this.refsetId, messageModifier, this.processOperationReturn, this.notificationService, this.refsetService, this.router);
	}

	processOperationReturn = (data) => {
		this.changeLockedStatus.emit(false);

		this.refsetDetails.ngOnInit();

		this.description = '';
	};

	setRoles(): void {
		console.log(this.selectedRoles);
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

	createTeamObject(): void {
		const params: any = {
			active: true,
			name: this.name,
			description: this.description,
			primaryContactEmail: this.email,
			privateTeam: this.privateTeam,
			roles: this.selectedRoles,
			organization: this.organization,
			members: this.members,
		};

		this.teamsService.createTeam(params).subscribe(
			(data) => {
				this.notificationService.show('The Team is created.', null, 'success', { timeOut: 0, extendedTimeOut: 0 });
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
