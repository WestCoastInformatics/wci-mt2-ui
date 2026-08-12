import { ElementRef, Component, Input, TemplateRef, ViewChild } from '@angular/core';
import { FormControl } from '@angular/forms';
import { NgbModal, NgbModalRef } from '@ng-bootstrap/ng-bootstrap';
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
	isModalOpen = false;
	notesModalRef!: NgbModalRef;

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

	getNotes() {
		this.refsetService.getNotes(this.mapSetId, this.conceptCode).subscribe(
			(response) => {
				if (response) {
					this.notesList = [];
					// this.notesList = [{ date: '121243', user: 'name', notes: 'test text' }];
					console.log('get notes Info: ', response);
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

	removeNote(noteId: string) {
		this.refsetService.removeNote(this.mapSetId, this.conceptCode, noteId).subscribe(
			(response) => {
				if (response) {
					console.log(' notes Info: ', response);
					this.notificationService.show('The notes have been removed.', 'Removed', 'success', { timeOut: 0, extendedTimeOut: 0 });
				}
			},
			(error: any) => {
				console.log(' Error: ', error);
				this.notificationService.show('Error removing, please try again.', 'Error', 'error', { timeOut: 2500, extendedTimeOut: 0 });
			},
		);
	}

	saveNotes() {
		if (this.notesFC.dirty) {
			this.refsetService.saveNotes(this.mapSetId, this.conceptCode, JSON.stringify(this.notesFC.value)).subscribe(
				(response) => {
					if (response) {
						console.log(' notes Info: ', response);
						this.notificationService.show('The notes have been saved.', 'Saved', 'success', { timeOut: 0, extendedTimeOut: 0 });
						this.showAddNotes = false;
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
