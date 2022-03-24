import { Component, EventEmitter, Input, OnInit, Output, SimpleChanges, TemplateRef, ViewChild } from '@angular/core';
import { Router } from '@angular/router';
import { NgbModal, NgbModalRef } from '@ng-bootstrap/ng-bootstrap';
import { NotificationService } from 'src/app/services/notification.service';
import { RefsetService } from 'src/app/services/rest/refset.service';
import { CodeUtility } from 'src/app/utilities/code.utility';
import { RefsetUtility } from 'src/app/utilities/refset.utility';
import { UiUtility } from 'src/app/utilities/ui.utility';

@Component({
	selector: 'add-remove-concepts',
	templateUrl: './add-remove-concepts.component.html'
})
export class AddRemoveConceptsComponent implements OnInit {

	selectedOption: string;
	openedModel: NgbModalRef;
	actionText: string;
	refsetInternalId: string;
	options = [
		{ value: '<< ', display: '\<\<       (Descendants and Self)' },
		{ value: '< ', display: '\<       (Descendants Only) ' },
		{ value: '', display: '\=       (Self Only)' }
	];

	@Input() changeMethod: string;
	@Input() isAdd: boolean;
	@Input() refset: any;
	@Input() definitionExceptionType: string;
	@Input() definitionExceptionId: string;
	@Input() conceptCode: string;
	@Input() conceptName: string;
	@Input() conceptHasChildren: boolean;
	@Input() isInactive: boolean;
	@Input() isReplacement: boolean;
	@Input() processChangedMemberFunction: () => void;
	@Output() changeLockedStatus = new EventEmitter<any>(true);
	@Output() onMembersGridReady = new EventEmitter<any>();
	@Output() selectedEvent = new EventEmitter<string>();

	@ViewChild("addRemoveDescendantsDialog") dialogSection: TemplateRef<any>;
	replacementCode: any;

	constructor(private readonly modalService: NgbModal, private refsetService: RefsetService, private notificationService: NotificationService, private router: Router) { }

	ngOnInit(): void {
	}

	ngOnChanges(changes: SimpleChanges) {

		for (const propertyName in changes) {

			if (propertyName === "isAdd") {

				this.isAdd = this.isAdd == true;

				if (this.isAdd) {
					this.actionText = "Add";
				} else {
					this.actionText = "Remove";
				}

				// if this isn't the initial setup then call addRemoveConcept
				if (!changes[propertyName].firstChange) {

					this.resetComponent();
					this.addRemoveConcept();
				}
			
			} else if (propertyName === "refset") {
				this.refsetInternalId = this.refset?.id;
			}
		}
	}

	addRemoveConceptsForAdjudication(inactiveData: any, replacementData: any): void {
		this.conceptCode = inactiveData?.code;
		this.replacementCode = replacementData?.code;
		console.log(this.replacementCode)
		if (this.changeMethod === 'INACTIVE_ADDED' || this.changeMethod === 'REPLACEMENT_ADDED') {
			this.actionText = "Add";
		} else {
			this.actionText = "Remove";
		}

			this.resetComponent();
			this.addRemoveConcept(this.changeMethod);
	
	}

	addRemoveConcept(changeMethod?: string): void {
        let conceptId: string = '';
		let ecl = '';
		let description: string;

		if (this.openedModel != null) {

			this.openedModel.close();
			this.openedModel = null;
		}

		if (CodeUtility.hasValue(this.selectedOption)){
			ecl = this.selectedOption;
		}

        if (ecl == '' && CodeUtility.hasValue(this.conceptCode)) {

            if (this.conceptHasChildren && this.refset.type != RefsetUtility.INTENSIONAL) {

                this.openAddRemoveDescendantsModal();
                return;
            }

			conceptId = this.conceptCode;
        }
                
        this.changeLockedStatus.emit(true);


		if (changeMethod) {

			if (changeMethod === 'INACTIVE_ADDED') {

				description = 'added to';
				this.refsetService.modifyMembersForUpgrade(this.refsetInternalId, this.conceptCode, this.changeMethod).subscribe();
			} else if (changeMethod === 'INACTIVE_REMOVED') {
	
				description = 'removed from';
				this.refsetService.modifyMembersForUpgrade(this.refsetInternalId, this.conceptCode, this.changeMethod).subscribe();
			} else if (changeMethod === 'REPLACEMENT_ADDED') {

				description = 'added to';
				this.refsetService.modifyMembersForUpgrade(this.refsetInternalId, this.conceptCode, this.changeMethod, this.replacementCode).subscribe();
			} else if (changeMethod === 'REPLACEMENT_REMOVED'){
	
				description = 'removed from';
				this.refsetService.modifyMembersForUpgrade(this.refsetInternalId, this.conceptCode, this.changeMethod, this.replacementCode).subscribe();
			}

			console.log(changeMethod);
		}

		// if this is an intensional refset
		else if (this.refset.type == RefsetUtility.INTENSIONAL) {

			if (this.isAdd) {

				let encodedPipe = '%7C';
				ecl = this.conceptCode + ' ' + encodedPipe + ' ' + this.conceptName + ' ' + encodedPipe;
				description = 'added to';

				this.refsetService.addRefsetDefinitionExceptions(this.refsetInternalId, null, this.definitionExceptionType, '', ecl).subscribe();
	
			} else {
	
				description = 'removed from';
				this.refsetService.removeRefsetDefinitionException(this.refsetInternalId, this.definitionExceptionId).subscribe();
			}
		}

		// else if this is an extensional or external refset
		else {

			let operationFunction: Function;

			if (this.isAdd) {

				description = 'added to';
				operationFunction = this.refsetService.addRefsetMembers.bind(this.refsetService);
			} else {

				description = 'removed from';
				operationFunction = this.refsetService.removeRefsetMembers.bind(this.refsetService);
			}

			operationFunction(this.refsetInternalId, null, conceptId, ecl).subscribe();
		}

			UiUtility.manageNotifications(this.refsetInternalId, this.refset.refsetId, description, this.callMemberChangeFunction, this.notificationService, this.refsetService, this.router);
		this.onMembersGridReady.emit();
    }

	callMemberChangeFunction = () => {
		this.processChangedMemberFunction();
	}

	openAddRemoveDescendantsModal() {

		this.openedModel = this.modalService.open(this.dialogSection, {
			//backdrop: 'static',
			//keyboard: false,
			windowClass: 'add-remove-descendants-modal'
		});

		// need to set timeout so the reset happens after the dialog is open
		setTimeout(this.selectDefaultDescentantChoice, 1);
	}

	resetComponent = () => {
		this.selectedOption = null;
	}

	selectDefaultDescentantChoice = () => {
		this.selectedOption = '' + this.conceptCode;
	}
}