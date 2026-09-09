import { Component, EventEmitter, Input, Output, ElementRef, ViewChild, SimpleChanges, TemplateRef } from '@angular/core';
import { NgbModal, NgbModalRef } from '@ng-bootstrap/ng-bootstrap';
import { FormControl } from '@angular/forms';
import { RefsetService } from 'src/app/services/rest/refset.service';
import { AuthenticationService } from 'src/app/services/authentication/authentication.service';

@Component({
	standalone: false,
	selector: 'workflow-map-modal',
	templateUrl: './workflow-map-modal.component.html',
	styleUrls: ['workflow-map-modal.component.css'],
})
export class WorkflowMapModalComponent {
	userList: any;
	selectedUser: any;
	isModalOpen = false;
	waitingForMapResponse = false;
	workFlowModalRef!: NgbModalRef;
	workFlowMapNotesFC = new FormControl('');

	@Input() workFlowMapStatus: any;
	@Input() mapsetInfo: any;
	@Input() conceptCode: any;
	@Input() conceptCodeList: any;
	@Input() isWFMapModalOpen: any;
	@Input() multiple: boolean = false;
	@Output() updateWorkFlowMapStatus = new EventEmitter<any>();
	@Output() updateMultiWorkFlowMapStatus = new EventEmitter<any>();
	@Output() closeWorkflowMapModal = new EventEmitter<void>();

	@ViewChild('workFlowMapModalNotes') private workflowMapModalNotes!: ElementRef;
	@ViewChild('workFlowMapModal') workflowMapModal!: TemplateRef<any>;

	constructor(
		private readonly modalService: NgbModal,
		private refsetService: RefsetService,
		private authenticationService: AuthenticationService,
	) {}

	ngOnChanges(changes: SimpleChanges) {
		for (const propertyName in changes) {
			if (propertyName === 'isWFMapModalOpen') {
				if (changes.isWFMapModalOpen.currentValue === true) {
					this.selectedUser = null;
					this.userList = [];
					if (this.workFlowMapStatus.assign === true) {
						const assignment = this.workFlowMapStatus.assignment as string[];
						if (Array.isArray(assignment) && assignment.includes('ADMIN')) {
							this.userList = this.mapsetInfo.mapProject.mapLeads.filter((users: any) => {
								return users.applicationRole === 'ADMINISTRATOR';
							});
						}
						if (Array.isArray(assignment) && assignment.includes('LEAD')) {
							this.userList = this.mapsetInfo.mapProject.mapLeads.filter((users: any) => {
								return users.applicationRole === 'LEAD';
							});
						}
						if (Array.isArray(assignment) && assignment.includes('SPECIALIST')) {
							this.userList = this.mapsetInfo.mapProject.mapSpecialists.filter((users: any) => {
								return users.applicationRole === 'SPECIALIST';
							});
						}
					}
					this.openWorkFlowMapModal(this.workflowMapModal);
				}

				break;
			}
		}
	}

	openWorkFlowMapModal(content: any) {
		this.workFlowModalRef = this.modalService.open(content, { centered: true });
		this.isModalOpen = true;
		setTimeout(() => {
			this.workflowMapModalNotes.nativeElement.focus();
		}, 50);
	}

	closeWorkFlowMapModal() {
		this.closeWorkflowMapModal.emit();
		this.selectedUser = null;
		this.workFlowModalRef.close();
		this.isModalOpen = false;
		this.workFlowMapNotesFC.setValue('');
		this.workFlowMapNotesFC.reset();
		this.waitingForMapResponse = false;
	}

	changeWorkFlowMapStatus() {
		if (this.workFlowMapNotesFC.dirty && this.workFlowMapNotesFC.value) {
			this.workFlowMapStatus.notes = this.workFlowMapNotesFC.value;
		}
		this.waitingForMapResponse = true;
		if (this.multiple && this.conceptCodeList.length > 0) {
			this.refsetService
				.setMappingsWorkflowStatus(
					this.mapsetInfo.id,
					this.conceptCodeList,
					this.workFlowMapStatus.value,
					this.workFlowMapStatus.notes,
					this.selectedUser ? this.selectedUser : '',
				)
				.subscribe(
					(response) => {
						if (response) {
							this.updateMultiWorkFlowMapStatus.emit(response);
							this.closeWorkFlowMapModal();
						}
					},
					(err) => {
						console.error(' Error: ', err);
						this.authenticationService.checkError(err);
					},
				);
		} else {
			this.refsetService
				.setMappingWorkflowStatus(
					this.mapsetInfo.id,
					this.conceptCode,
					this.workFlowMapStatus.value,
					this.workFlowMapStatus.notes,
					this.selectedUser ? this.selectedUser : '',
				)
				.subscribe(
					(response) => {
						if (response) {
							this.updateWorkFlowMapStatus.emit(response);
							this.closeWorkFlowMapModal();
						}
					},
					(err) => {
						console.error(' Error: ', err);
						this.authenticationService.checkError(err);
					},
				);
		}
	}
}
