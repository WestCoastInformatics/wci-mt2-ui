// unsaved-changes-modal.component.ts
import { Component, inject } from '@angular/core';
import { NgbActiveModal } from '@ng-bootstrap/ng-bootstrap';

@Component({
	selector: 'app-unsaved-changes-modal',
	standalone: true,
	templateUrl: './unsaved-modal.component.html',
	styleUrls: ['./unsaved-modal.component.css'],
})
export class UnsavedModalComponent {
	// Inject the active modal reference
	activeModal = inject(NgbActiveModal);
}
