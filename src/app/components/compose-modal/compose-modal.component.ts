import { Component, EventEmitter, Input, OnInit, Output, TemplateRef } from '@angular/core';
import { NgbModal } from '@ng-bootstrap/ng-bootstrap';

@Component({
	selector: 'compose-modal',
	templateUrl: './compose-modal.component.html',
})
export class ComposeModalComponent {

	isMinimise: boolean = false;
	isHidden = false;
	poppedIn = false;
	@Input() data: any;
	@Input() title: string;
	@Input() content: TemplateRef<any> = null;
	modalRef;
	constructor(private modalService: NgbModal) { }
	ngOnInit() {
	}
	minimiseDialogue() {
		this.isMinimise = !this.isMinimise;
	}

	togglePopIn() {
		this.poppedIn = !this.poppedIn;
	}

	toggleShow() {
		this.isHidden = !this.isHidden;
	}

	get minimiseClass(): string {
		return this.isMinimise && this.poppedIn ? 'minimiseTheDIv' : 'maximiseTheDIv';
	}
}
