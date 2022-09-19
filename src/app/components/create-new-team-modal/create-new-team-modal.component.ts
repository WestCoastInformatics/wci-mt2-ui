import { Component, EventEmitter, Input, Output } from "@angular/core";
import { NgbModal, NgbModalRef } from "@ng-bootstrap/ng-bootstrap";
import { RefsetService } from "src/app/services/rest/refset.service";
import { TeamsService } from "src/app/services/rest/teams.service";
import { UiUtility } from "src/app/utilities/ui.utility";
import { NotificationService } from "src/app/services/notification.service";
import { RefsetDetails } from 'src/app/pages/refset-details';
import { CodeUtility } from "src/app/utilities/code.utility";
import { OrganizationsService } from "src/app/services/rest/organizations.service";
import { ActivatedRoute } from '@angular/router';
import { AuthenticationService } from "src/app/services/authentication/authentication.service";

@Component({
  selector: "create-new-team-modal",
  templateUrl: "./create-new-team-modal.component.html",
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

  constructor(
    private modalService: NgbModal,
    private refsetService: RefsetService,
    private teamsService: TeamsService,
    private organizationsService: OrganizationsService,
    private notificationService: NotificationService,
    private readonly refsetDetails: RefsetDetails,
    private readonly route: ActivatedRoute,
    private readonly authenticationService: AuthenticationService
  ) { }

  ngOnInit() {
    this.roleOptions = [{ value: 'AUTHOR', display: 'Author' }, { value: 'REVIEWER', display: 'Reviewer' },
    { value: 'ADMIN', display: 'Admin' }, { value: 'VIEWER', display: 'Viewer' }];

    try {

      this.refsetUser = JSON.parse(localStorage.getItem('refset_user'));
      this.members = [this.refsetUser.id];
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
  }

  setRoles(): void {
    console.log(this.selectedRoles);
  }

  isValidEmail(): boolean {
    if (this.email.length == 0) {
      return true;
    }
    var lower = this.email.toLowerCase();
    var flag = lower.match(/^(([^<>()[\]\\.,;:\s@"]+(\.[^<>()[\]\\.,;:\s@"]+)*)|(".+"))@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\])|(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,}))$/);

    if (flag == null) {
      this.emailError = "Email is invalid.";
    } else {
      this.emailError = "";
    }

    return flag == null ? false : true;
  }

  onKeyDownEvent(event: any) {

    console.log(event.target.value);
    this.isValidEmail();
  }

  createTeamObject(): void {

    let params: any = {
      active: true,
      name: this.name,
      description: this.description,
      primaryContactEmail: this.email,
      privateTeam: this.privateTeam,
      roles: this.selectedRoles,
      organization: this.organization,
      members: this.members
    };

    this.teamsService.createTeam(params).subscribe(
      (data) => {

        this.notificationService.show("The Team is created.", null, "success", { timeOut: 0, extendedTimeOut: 0 });
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
