// error-changes-modal.component.ts
import { Component, inject, Input } from '@angular/core';
import { NgbActiveModal } from '@ng-bootstrap/ng-bootstrap';

@Component({
	selector: 'app-error-changes-modal',
	standalone: true,
	templateUrl: './error-modal.component.html',
	styleUrls: ['./error-modal.component.css'],
})
export class ErrorModalComponent {
	@Input() errorMessage = '';
	// Inject the active modal reference
	activeModal = inject(NgbActiveModal);

	get summary(): string {
		const idx = this.errorMessage.indexOf(':');
		return idx > -1 ? this.errorMessage.substring(0, idx + 1) : this.errorMessage;
	}

	get items(): string[] {
		const idx = this.errorMessage.indexOf(':');
		if (idx === -1) return [];
		return this.errorMessage
			.substring(idx + 1)
			.split(/,\s*(?![^()]*\))/)
			.map((s) => s.trim())
			.filter((s) => s.length > 0);
	}
}
