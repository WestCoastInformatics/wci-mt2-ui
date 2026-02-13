import { Component, EventEmitter, Input, OnInit, Output, SimpleChanges, TemplateRef, ViewChild } from '@angular/core';
import { Router } from '@angular/router';
import { NgbModal, NgbModalRef } from '@ng-bootstrap/ng-bootstrap';
import { NotificationService } from 'src/app/services/notification.service';
import { RefsetService } from 'src/app/services/rest/refset.service';
import { CodeUtility } from 'src/app/utilities/code.utility';
import { Constants } from 'src/app/utilities/constants.utility';
import { UiUtility } from 'src/app/utilities/ui.utility';

@Component({
	standalone: false,
	selector: 'add-remove-concepts',
	templateUrl: './add-remove-concepts.component.html',
	styleUrls: ['add-remove-concepts.component.css'],
})
export class AddRemoveConceptsComponent implements OnInit {
	selectedOption: string;
	openedModel: NgbModalRef;
	actionText: string;
	refsetInternalId: string;
	running = false;
	options = [
		{ value: '<< ', display: '<<       (Descendants and Self)' },
		{ value: '< ', display: '<       (Descendants Only) ' },
		{ value: '', display: '=       (Self Only)' },
	];

	changeMethod = '';
	replacementCode: any;
	@Input() isAdd: boolean;
	@Input() refset: any;
	@Input() definitionExceptionType: string;
	@Input() definitionExceptionId: string;
	@Input() conceptCode: string;
	@Input() conceptName: string;
	@Input() conceptHasChildren: boolean;
	@Input() isReplacement: boolean;
	@Input() processChangedMemberFunction: Function;
	@Output() changeLockedStatus = new EventEmitter<any>(true);
	@Output() onMembersGridReady = new EventEmitter<any>();
	@Output() selectedEvent = new EventEmitter<string>();

	@ViewChild('addRemoveDescendantsDialog') dialogSection: TemplateRef<any>;

	constructor(private readonly modalService: NgbModal, private refsetService: RefsetService, private notificationService: NotificationService, private router: Router) {}

	ngOnInit(): void {}

	ngOnChanges(changes: SimpleChanges) {
		for (const propertyName in changes) {
			if (propertyName === 'isAdd') {
				this.isAdd = this.isAdd == true;

				if (this.isAdd == true) {
					this.actionText = 'Add';
				} else {
					this.actionText = 'Remove';
				}

				// if this isn't the initial setup then call addRemoveConcept
				if (!changes[propertyName].firstChange) {
					//this.resetComponent();
					//this.addRemoveConcept();
				}
			} else if (propertyName === 'refset') {
				this.refsetInternalId = this.refset?.id;
			}
		}
	}

	addRemoveConceptsForAdjudication(inactiveData: any, replacementData: any): void {
		this.conceptCode = inactiveData?.code;
		this.replacementCode = replacementData?.code;
		if (this.changeMethod === 'INACTIVE_ADDED' || this.changeMethod === 'REPLACEMENT_ADDED') {
			this.actionText = 'Add';
		} else {
			this.actionText = 'Remove';
		}

		this.addRemoveConcept();
	}

	addRemoveConcept(): void {
		if (!this.running) {
			this.running = true;

			let conceptId = '';
			let ecl = '';
			let description: string;

			if (this.openedModel != null) {
				this.openedModel.close();
				this.openedModel = null;
			}

			if (CodeUtility.hasValue(this.selectedOption)) {
				ecl = this.selectedOption;
			}

			if (ecl == '' && CodeUtility.hasValue(this.conceptCode)) {
				if (CodeUtility.testBoolean(this.conceptHasChildren) && this.refset.type != Constants.INTENSIONAL) {
					this.openAddRemoveDescendantsModal();
					return;
				}

				conceptId = this.conceptCode;
			}
			if (this.isAdd == true) {
				description = 'added to';
			} else {
				description = 'removed from';
			}
			console.timeEnd('add-remove addRemoveConcept before lock emit');
			this.changeLockedStatus.emit(true);
			console.timeEnd('add-remove addRemoveConcept after lock emit');
			if (this.changeMethod) {
				if (this.changeMethod === 'INACTIVE_ADDED') {
					this.refsetService.modifyMembersForUpgrade(this.refsetInternalId, this.conceptCode, this.changeMethod).subscribe();
				} else if (this.changeMethod === 'INACTIVE_REMOVED') {
					this.refsetService.modifyMembersForUpgrade(this.refsetInternalId, this.conceptCode, this.changeMethod).subscribe();
				} else if (this.changeMethod === 'REPLACEMENT_ADDED') {
					this.refsetService.modifyMembersForUpgrade(this.refsetInternalId, this.conceptCode, this.changeMethod, this.replacementCode).subscribe();
				} else if (this.changeMethod === 'REPLACEMENT_REMOVED') {
					this.refsetService.modifyMembersForUpgrade(this.refsetInternalId, this.conceptCode, this.changeMethod, this.replacementCode).subscribe();
				}
			}
			// if this is an intensional refset
			else if (this.refset.type == Constants.INTENSIONAL) {
				if (this.isAdd == true) {
					const encodedPipe = '%7C';
					ecl = this.conceptCode + ' ' + encodedPipe + ' ' + this.conceptName + ' ' + encodedPipe;
					description = this.definitionExceptionType + ' added to';

					this.refsetService.addRefsetDefinitionExceptions(this.refsetInternalId, null, this.definitionExceptionType, '', ecl).subscribe();
				} else {
					description = this.definitionExceptionType + ' removed from';
					this.refsetService.removeRefsetDefinitionException(this.refsetInternalId, this.definitionExceptionId).subscribe();
				}
			}
			// else if this is an extensional or external refset
			else {
				let operationFunction: Function;
				if (this.isAdd == true) {
					operationFunction = this.refsetService.addRefsetMembers.bind(this.refsetService);
				} else {
					operationFunction = this.refsetService.removeRefsetMembers.bind(this.refsetService);
				}

				operationFunction(this.refsetInternalId, null, conceptId, ecl).subscribe();
			}
			console.timeEnd('add-remove addRemoveConcept before manageMemberNotifications');
			setTimeout(() => {
				UiUtility.manageMemberNotifications(this.refsetInternalId, this.refset.refsetId, description, this.callMemberChangeFunction, this.notificationService, this.refsetService, this.router);
				console.timeEnd('add-remove addRemoveConcept after manageMemberNotifications');
			}, 100);
		}
	}

	callMemberChangeFunction = (data) => {
		this.running = false;
		this.processChangedMemberFunction(data);
	};

	openAddRemoveDescendantsModal() {
		this.openedModel = this.modalService.open(this.dialogSection, {
			backdrop: 'static',
			keyboard: false,
			windowClass: 'add-remove-descendants-modal',
		});

		// need to set timeout so the reset happens after the dialog is open
		setTimeout(this.selectDefaultDescentantChoice, 1);
	}

	resetComponent = () => {
		this.selectedOption = null;
	};

	selectDefaultDescentantChoice = () => {
		this.selectedOption = '' + this.conceptCode;
	};
}
