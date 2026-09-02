import { ElementRef, Component, Input, TemplateRef, ViewChild } from '@angular/core';
import { FormControl } from '@angular/forms';
import { NgbModal, NgbModalRef } from '@ng-bootstrap/ng-bootstrap';
import { UiUtility } from 'src/app/utilities/ui.utility';
import { RefsetService } from 'src/app/services/rest/refset.service';
import { NotificationService } from 'src/app/services/notification.service';

@Component({
	standalone: false,
	selector: 'notes-modal',
	templateUrl: './notes-modal.component.html',
	styleUrls: ['notes-modal.component.css'],
})
export class NotesModalComponent {
	notesFC = new FormControl('');
	notesList: any;
	showAddNotes = false;
	confirmRemoveNote = false;
	isModalOpen = false;
	notesModalRef!: NgbModalRef;
	uiUtility = UiUtility;

	@ViewChild('notes') private notes!: ElementRef;
	@ViewChild('notesModal') notesModal!: TemplateRef<any>;

	@Input() libraryOnly: any;
	@Input() mapSetId: any;
	@Input() conceptCode: any;

	constructor(
		private refsetService: RefsetService,
		private notificationService: NotificationService,
		private modalService: NgbModal,
	) {}

	ngOnInit() {
		this.getNotes();
	}

	getNotes() {
		this.refsetService.getNotes(this.mapSetId, this.conceptCode).subscribe(
			(response) => {
				if (response) {
					this.notesList = response.map((item: any) => ({
						id: item.id,
						date: item.modified,
						user: item.user?.name,
						notes: JSON.parse(item.note),
					}));
					this.notesList.sort((a: any, b: any) => {
						const ad = a.date || 0;
						const bd = b.date || 0;
						return bd - ad;
					});
				}
			},
			(error: any) => {
				console.log(' Error: ', error);
				this.notificationService.show('Error saving, please try again.', 'Error', 'error', { timeOut: 2500, extendedTimeOut: 0 });
			},
		);
	}

	openNotesModal(content: any) {
		this.getNotes();
		this.notesList = [];
		this.notesModalRef = this.modalService.open(content, { size: 'lg', centered: true });
		this.isModalOpen = true;
	}

	addNotes() {
		this.showAddNotes = true;
		setTimeout(() => {
			this.notes.nativeElement.focus();
		}, 50);
	}

	closeNotesModal() {
		this.showAddNotes = false;
		this.notesModalRef.close();
		this.isModalOpen = false;
		this.notesFC.setValue('');
		this.notesFC.reset();
	}

	dateFormatter(val: any): any {
		return UiUtility.dateFormatter(val);
	}

	checkRemove(noteId: string) {
		this.confirmRemoveNote = true;
		setTimeout(() => {
			const confirmBtn = document.querySelector('[title="Confirm Remove"]');
			confirmBtn?.addEventListener('click', () => {
				this.removeNote(noteId);
			});
		}, 10);
	}

	removeNote(noteId: string) {
		this.confirmRemoveNote = false;
		this.refsetService.removeNote(this.mapSetId, this.conceptCode, noteId).subscribe(
			(response) => {
				//response
			},
			(error: any) => {
				console.log(' Error: ', error);
				this.notificationService.show('Error removing, please try again.', 'Error', 'error', { timeOut: 2500, extendedTimeOut: 0 });
			},
		);

		setTimeout(() => {
			this.notificationService.show('The notes have been removed.', 'Removed', 'success', { timeOut: 2500, extendedTimeOut: 0 });
			this.getNotes();
		}, 1200);
	}

	saveNotes() {
		if (this.notesFC.dirty) {
			this.refsetService.saveNotes(this.mapSetId, this.conceptCode, JSON.stringify(this.notesFC.value)).subscribe(
				(response) => {
					if (response) {
						this.notesFC.reset();
						this.notificationService.show('The notes have been saved.', 'Saved', 'success', { timeOut: 2500, extendedTimeOut: 0 });
						this.showAddNotes = false;
						this.getNotes();
					}
				},
				(error: any) => {
					console.log(' Error: ', error);
					this.notificationService.show('Error saving, please try again.', 'Error', 'error', { timeOut: 2500, extendedTimeOut: 0 });
				},
			);
		}
	}
}
