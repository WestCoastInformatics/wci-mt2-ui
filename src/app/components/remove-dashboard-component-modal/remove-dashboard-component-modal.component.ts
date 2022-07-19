import { Component, EventEmitter, HostListener, Input, Output } from "@angular/core";
import { NgbModal, NgbModalRef } from "@ng-bootstrap/ng-bootstrap";
import { RefsetService } from "src/app/services/rest/refset.service";
import { NotificationService } from "src/app/services/notification.service";
import { OrganizationsService } from "src/app/services/rest/organizations.service";
import { TeamsService } from "src/app/services/rest/teams.service";
import { ProjectsService } from "src/app/services/rest/projects.service";
import { Router } from '@angular/router';
import { TitleCasePipe } from "@angular/common";

@Component({
    selector: "remove-dashboard-component-modal",
    templateUrl: "./remove-dashboard-component-modal.component.html",
    providers: [TitleCasePipe]
})
export class RemoveDashboardComponentModalComponent {
  
    openedModel: NgbModalRef;
    confirmString: string = '';

    @Input() componentType: string;  // should be organization, project or team
    @Input() componentId: string;
    @Input() componentName: string;
    @Input() disabled: boolean = false;
    @Output() changeLockedStatus = new EventEmitter<any>(true);
    
    constructor(
        private modalService: NgbModal,
        private refsetService: RefsetService,
        private organizationsService: OrganizationsService,
        private projectsService: ProjectsService,
        private teamsService: TeamsService,
        private notificationService: NotificationService,
        private readonly router: Router,
        private titleCasePipe: TitleCasePipe
    ) {}

    callMemberOperation(): void {
        this.changeLockedStatus.emit(true);
        this.removeComponent();
    }

    removeComponent(): void {
        if (this.componentType.toLowerCase() === 'organization') {
            this.organizationsService.deleteOrganization(this.componentId).subscribe((x) => {
                this.router.navigate(['/dashboard']);
            });
        } else if (this.componentType.toLowerCase() === 'project') {
            this.projectsService.deleteProject(this.componentId).subscribe((x) => {
                console.log(x)
                this.router.navigate(['/dashboard']);
            });
        } else if (this.componentType.toLowerCase() === 'team') {
            this.teamsService.deleteTeam(this.componentId).subscribe((x) => {
                this.router.navigate(['/dashboard']);
            });
        }
        this.modalService.dismissAll();
    }

    processOperationReturn = (data) => { 

        this.changeLockedStatus.emit(false);
    }

    openRemoveDashboardComponentModal(removeDashboardComponentDialog: NgbModal) {
        this.openedModel = this.modalService.open(removeDashboardComponentDialog, {
        });
    }

    isDisabled() {
        return this.confirmString.trim() != 'remove ' + this.componentType;
    }

    
  @HostListener('window:keyup', ['$event'])
  keyEvent(event: KeyboardEvent) {
    if(event.key == 'Enter'){
      this.callMemberOperation();
    }
  }
}
