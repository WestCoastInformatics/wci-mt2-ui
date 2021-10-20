import { Component, EventEmitter, Input, OnInit, Output, SimpleChanges, TemplateRef, ViewChild } from '@angular/core';
import { NgbModal } from '@ng-bootstrap/ng-bootstrap';

@Component({
	selector: 'add-remove-descendants-modal',
	templateUrl: './add-remove-descendants-modal.component.html'
})
export class AddRemoveDescendantsModalComponent implements OnInit {

	selectedOption: string;
	actionText: string;
	options = [
		{ value: '<< ', display: '\<\<       (Decendants and Self)' },
		{ value: '< ', display: '\<       (Decendants Only) ' },
		{ value: '', display: '\=       (Self Only)' }
	];

	@Input() isAdd: boolean;
	@Input() conceptCode: string;
	@Input() conceptName: string;
	@Output() selectedEvent = new EventEmitter<string>();

	@ViewChild("addRemoveDescendantsDialog") dialogSection: TemplateRef<any>;

	constructor(private readonly modalService: NgbModal) { }

	ngOnInit(): void {
	}

	ngOnChanges(changes: SimpleChanges) {

		for (const propertyName in changes) {

			if (propertyName === "isAdd") {

				if (this.isAdd) {
					this.actionText = "Add";
				} else {
					this.actionText = "Remove";
				}
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
		setTimeout(this.resetForm.bind(this), 1);
	}

	resetForm() {
		this.selectedOption = '' + this.conceptCode;
	}

	submitForm() {
		this.selectedEvent.emit(this.selectedOption);
	}

}
