import { Component, EventEmitter, Input, OnInit, Output, SimpleChanges, TemplateRef, ViewChild } from '@angular/core';
import { NgbModal } from '@ng-bootstrap/ng-bootstrap';
import { RefsetService } from 'src/app/services/rest/refset.service';
import { CodeUtility } from 'src/app/utilities/code.utility';
import { RefsetUtility } from 'src/app/utilities/refset.utility';

@Component({
	selector: 'add-remove-concepts',
	templateUrl: './add-remove-concepts.component.html'
})
export class AddRemoveConceptsComponent implements OnInit {

	selectedOption: string;
	actionText: string;
	refsetInternalId: string;
	options = [
		{ value: '<< ', display: '\<\<       (Descendants and Self)' },
		{ value: '< ', display: '\<       (Descendants Only) ' },
		{ value: '', display: '\=       (Self Only)' }
	];

	@Input() isAdd: boolean;
	@Input() refset: any;
	@Input() definitionExceptionType: string;
	@Input() definitionExceptionId: string;
	@Input() conceptCode: string;
	@Input() conceptName: string;
	@Input() conceptHasChildren: boolean;
	@Output() sendLoadingSpinnerTrigger = new EventEmitter<any>(true);
	@Output() processChangedMemberEffects = new EventEmitter<any>(true);
	@Output() selectedEvent = new EventEmitter<string>();

	@ViewChild("addRemoveDescendantsDialog") dialogSection: TemplateRef<any>;

	constructor(private readonly modalService: NgbModal, private refsetService: RefsetService) { }

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

	addRemoveConcept(): void {

        let conceptId: string = '';
		let ecl = '';

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
                
        this.sendLoadingSpinnerTrigger.emit(true);

		// if this is an intensional refset
		if (this.refset.type == RefsetUtility.INTENSIONAL) {

			if (this.isAdd) {

				let encodedPipe = '%7C';
				ecl = this.conceptCode + ' ' + encodedPipe + ' ' + this.conceptName + ' ' + encodedPipe;
				
				this.refsetService.addRefsetDefinitionExceptions(this.refsetInternalId, null, this.definitionExceptionType, '', ecl).subscribe(
					
					(data) => {
	
						console.log("data: ", data);
						this.processChangedMemberEffects.emit();
					},
					(error) => {
	
						console.log(error);
						this.sendLoadingSpinnerTrigger.emit(false);
					}
				);
	
			} else {
	
				this.refsetService.removeRefsetDefinitionException(this.refsetInternalId, this.definitionExceptionId).subscribe(
	
					(data) => {
	
						console.log("data: ", data);
						this.processChangedMemberEffects.emit();
					},
					(error) => {
	
						console.log(error);
						this.sendLoadingSpinnerTrigger.emit(false);
					}
				);
			}
		}

		// if this is an extensional or external refset
		else {

			if (this.isAdd) {

				this.refsetService.addRefsetMembers(this.refsetInternalId, null, conceptId, ecl).subscribe(
					
					(data) => {
	
						console.log("data: ", data);
						this.processChangedMemberEffects.emit();
					},
					(error) => {
	
						console.log(error);
						this.sendLoadingSpinnerTrigger.emit(false);
					}
				);
	
			} else {
	
				this.refsetService.removeRefsetMembers(this.refsetInternalId, null, conceptId, ecl).subscribe(
	
					(data) => {
	
						console.log("data: ", data);
						this.processChangedMemberEffects.emit();
					},
					(error) => {
	
						console.log(error);
						this.sendLoadingSpinnerTrigger.emit(false);
					}
				);
			}
		}

		
    }

	openAddRemoveDescendantsModal() {

		this.modalService.open(this.dialogSection, {
			backdrop: 'static',
			keyboard: false,
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