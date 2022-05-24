import { Component, EventEmitter, Input, OnInit, Output, SimpleChanges, TemplateRef, ViewChild } from '@angular/core';
import { NgbModal, NgbModalRef } from '@ng-bootstrap/ng-bootstrap';
import { Refset } from 'src/app/models/refset';
import { RefsetService } from 'src/app/services/rest/refset.service';
import { CodeUtility } from 'src/app/utilities/code.utility';
import { UiUtility } from 'src/app/utilities/ui.utility';
import { CategoryFilterComponent } from 'src/app/components/categoryFilter/category-filter.component';
import { TemplateRenderer } from 'src/app/components/cellRenderers/template.renderer';
import { PaginationComponent } from 'src/app/components/pagination/pagination.component';
import { AuthenticationService } from 'src/app/services/authentication/authentication.service';
import { User } from 'src/app/models/user';
import { DateTextFilterComponent } from 'src/app/components/dateTextFilter/date-text-filter.component';

@Component({
	selector: 'app-refset-discussion-list',
	templateUrl: './refset-feedback-list.component.html'
})
export class RefsetFeedbackListComponent implements OnInit {

	user: User;
	isUserLoggedIn: boolean;
	hasEditingRoles = false;
	canViewPrivateThreads = false;
	openedThreadListModal: NgbModalRef;
	openedThreadModal: NgbModalRef;
	openedConfirmModal: NgbModalRef;
	threadsData = [];
	selectedThread: any;
	displayHeader: string = 'Feedback';
	refsetGridOptions = {};
	canEditThread = false;
	canDeleteThread = false;
	newThread = false;
	editThread = false;
	showHiddenPosts = false;
	isResolved = false;
	gridApi: any;
	gridColumnDefs = [];
	gridOptions: any;
	gridPaging = { pageSize: 10, pageSizeOptions: [10, 25, 50, 100], totalKnown: false, totalRows: null, manualStateRefresh: new Boolean(true) };
	showTable: boolean = false;
	postTruncationLength = 500;
	tinyMceConfig = {
		base_url: '/tinymce',
		suffix: '.min',
		height: 200,
		menubar: false,
		plugins: ['lists advlist'],
		toolbar: 'undo redo | bold italic | bullist numlist outdent indent'
	};
	postPrivateField: boolean;
	postVisibilityField: boolean;
	postStatusField: string;
	postMessageField: string;
	postSubjectField: string;
	postButtonText: string;
	RESOLVED = 'Resolved';
	OPEN = 'Open';
	VISIBLE = 'Visible';
	HIDDEN = 'Hidden';
	uiUtility = UiUtility;

	@Input() type: string;
	@Input() refsetInternalId: string;
	@Input() refsetId: string;
	@Input() refsetName: string;
	@Input() conceptId: string = null;
	@Input() conceptName: string;
	@Input() roles: string[];
	@Input() discussionCount: number;
	@Output() discussionCountChange = new EventEmitter<number>();

	@ViewChild('discussionListPagination') paginationComponent: PaginationComponent;
	@ViewChild('discussionListAuthorSection') authorSection: TemplateRef<any>;
	@ViewChild('discussionListSubjectSection') subjectSection: TemplateRef<any>;
	@ViewChild('threadListModal') threadListModal: NgbModal;
	@ViewChild('threadModal') threadModal: NgbModal;
	@ViewChild('confirmDeleteThreadModal') confirmDeleteThreadModal: NgbModal;

	constructor(private readonly modalService: NgbModal, readonly refsetService: RefsetService, private authenticationService: AuthenticationService) { }

	ngOnInit() {

		this.user = this.authenticationService.getUser();
		this.isUserLoggedIn = this.user && this.user.userName != this.authenticationService.GUEST_USER;

		if (this.roles.includes("AUTHOR") || this.roles.includes("REVIEWER") || this.roles.includes("ADMIN")) {
			this.hasEditingRoles = true;
		}

		if (this.roles.includes("VIEWER")) {
			this.canViewPrivateThreads = true;
		}
	}

	ngOnChanges(changes: SimpleChanges) {

        for (const propertyName in changes) {

            if (propertyName === "refsetName" || propertyName === "conceptName") {

				if (this.type == 'REFSET') {
					this.displayHeader = 'Refset Feedback: ' + this.refsetName;
				} else {
					this.displayHeader = 'Member Feedback: ' + this.conceptName + ' (' + this.conceptId + ') for Refset: ' + this.refsetName;
				}
			}
		}
	}

	openThreadListModal() {

		this.openedThreadListModal = this.modalService.open(this.threadListModal, { backdrop: 'static', keyboard: false, modalDialogClass: 'full-modal', centered: true});

		this.selectedThread = null;
		this.newThread = false;
		this.showTable = true;

		this.gridOptions = {
			context: { componentParent: this },
			pagination: false,
			suppressColumnVirtualisation: false, // need this so you can access rows and cells that might not be currently visible, including if the grid is hidden
			suppressPaginationPanel: true,
			paginationPageSize: this.gridPaging.pageSize,
			rowSelection: 'single',
			enableCellTextSelection: true,
			onCellClicked: this.onGridCellClick,
			onGridReady: this.onGridReady,
			frameworkComponents: {
				templateRenderer: TemplateRenderer,
				categoryFilterComponent: CategoryFilterComponent,
				dateTextFilterComponent: DateTextFilterComponent
			},
			defaultColDef: {
				sortable: true,
				resizable: true,
				suppressMenu: true,
				flex: 1,
				filter: true,
				floatingFilter: true,
				floatingFilterComponentParams: { placeholder: '', suppressFilterButton: true },
			},
			enableBrowserTooltips: true,
			rowClassRules: {
				refset_tool_grid_inactive_row: function (params) {

					var inactivatedRow = false;

					if (params.data) {
						inactivatedRow = params.data.active == false;
					}

					return inactivatedRow;
				},
			},
		};

		this.gridColumnDefs = [
			{ field: 'id', headerName: 'Author', minWidth: 120, tooltipField: 'Author', cellRenderer: 'templateRenderer', cellRendererParams: { template: this.authorSection } },
			{ field: 'subject', headerName: 'Feedback Topic', tooltipField: 'Feedback Topic', minWidth: 300, cellRenderer: 'templateRenderer', cellRendererParams: { template: this.subjectSection } },
			{
				field: 'status', headerName: 'Status', tooltipField: 'Status', floatingFilterComponent: 'categoryFilterComponent', floatingFilterComponentParams: {
					names: [
						{ type: 'status', name: this.OPEN, value: this.OPEN },
						{ type: 'status', name: this.RESOLVED, value: this.RESOLVED }
					]
				}
			},
			{ field: 'lastPost', headerName: 'Last Comment', sort: "desc", tooltipField: 'Last Comment', valueGetter: UiUtility.gridDateValueGetter, floatingFilterComponent: 'dateTextFilterComponent' },
			{ field: 'numberReplies', headerName: 'Replies', tooltipField: 'Replies' },
			{
				field: 'visibility', headerName: 'Visibility', tooltipField: 'visibility', floatingFilterComponent: 'categoryFilterComponent', floatingFilterComponentParams: {
					names: [
						{ type: 'status', name: this.VISIBLE, value: this.VISIBLE },
						{ type: 'status', name: this.HIDDEN, value: this.HIDDEN }
					]
				}
			}
		];

		// set placeholders on the grid floating filter fields
        UiUtility.applyGridPlaceholders('#discussionThreadListGridSection .ag-floating-filter-full-body .ag-input-field-input');
	}

	onGridReady = (gridReadyParams) => {

        this.gridApi = gridReadyParams.api;
		// let conceptId = null;

		// if (CodeUtility.hasValue(this.conceptId)) {
		// 	conceptId = this.conceptId;
		// }

        this.refsetService.getDiscussionThreads(this.type, this.refsetInternalId, this.conceptId).subscribe({
            next: (results) => {

                results.total = results.items.length;
                results.totalKnown = true;
                this.threadsData = results.items;
                console.log(results);
                let pageNumber = 1;

                if (results.items.length == 0) {

                    this.gridApi.showNoRowsOverlay();
                    this.gridApi.setRowData([]);

                    if (pageNumber > 1) {

                        this.gridPaging.totalRows = this.gridApi.paginationGetPageSize() * (pageNumber - 1);
                        this.gridPaging.totalKnown = true;
                        this.paginationComponent.goToPage(pageNumber - 1);
                    }

                    return;
                }

                UiUtility.applyServerPagedGridResults(results, this.gridApi, this.gridPaging, pageNumber, null, false);
            },
            error: (error) => {

                this.gridApi.showNoRowsOverlay();
                this.gridApi.setRowData([]);
            }
        });
    }

	onGridCellClick = (event) => {

		this.selectedThread = event.data;
		this.openThreadModal();
	}

	openThreadModal(newThread = false) {

		this.newThread = newThread;
		this.postPrivateField = false;
		this.postMessageField = '';
		this.postSubjectField = '';
		this.showHiddenPosts = false;

		if (newThread) {

			this.isResolved = false;
			this.selectedThread = null;
			this.postButtonText = 'Start Discussion';
			this.canEditThread = true;
			this.canDeleteThread = true;

		} else {

			this.isResolved = this.selectedThread.status == this.RESOLVED;
			this.postButtonText = 'Reply';

			if (this.hasEditingRoles || this.selectedThread.posts[0].user.userName == this.user.userName) {
				this.canEditThread = true;
			} else {
				this.canEditThread = false;
			}

			if (this.roles.includes("ADMIN") || this.selectedThread.posts[0].user.userName == this.user.userName) {
				this.canDeleteThread = true;
			} else {
				this.canDeleteThread = false;
			}
		}

		this.openedThreadModal = this.modalService.open(this.threadModal, { modalDialogClass: 'full-modal', centered: true });
	}

	updateThread() {

		this.editThread = true;
		this.postPrivateField = this.selectedThread.privateThread;
		this.postMessageField = this.selectedThread.posts[0].message;
		this.postSubjectField = this.selectedThread.subject;
		this.postButtonText = 'Update Discussion';
	}

	checkComplete() {

		let complete = this.postMessageField != '';

		if (this.newThread || this.editThread) {
			complete = complete && this.postSubjectField != '';
		}

        return complete;
    }

	saveChanges() {

		let post: any = { message: this.postMessageField, privatePost: this.postPrivateField, visibility: this.VISIBLE };

		if (!this.newThread && !this.editThread) {

			this.refsetService.addDiscussionPost(this.selectedThread.id, JSON.stringify(post)).subscribe({
				next: (results) => {
	
					post.user = this.user;
					this.selectedThread.numberReplies++;
					this.selectedThread.lastPost = results.created;
					this.selectedThread.posts.push(results);

					this.resetPostForm();
					this.reloadGridData();
				}
			});

		} else if (this.newThread) {

			let thread: any = { 
				type: this.type, 
				refsetInternalId: this.refsetInternalId,
				conceptId: this.conceptId,
				subject: this.postSubjectField, 
				privateThread: this.postPrivateField, 
				visibility: this.VISIBLE, 
				status: this.OPEN, 
				posts: [post] 
			};

			this.refsetService.addDiscussionThread(JSON.stringify(thread)).subscribe({
				next: (results) => {

					post.user = this.user;
					this.threadsData.push(results);
					this.selectedThread = results;
					this.gridPaging.totalRows++;
					this.discussionCount++;
					this.discussionCountChange.emit(this.discussionCount);

					this.resetPostForm();
					this.reloadGridData();
				}
			});
		
		} else {

			let updatedThread = CodeUtility.clone(this.selectedThread);

			updatedThread.subject = this.postSubjectField;
			updatedThread.privateThread = this.postPrivateField;

			let updatedPost = updatedThread.posts[0];
			updatedPost.message = this.postMessageField;
			updatedPost.privatePost = this.postPrivateField;

			this.refsetService.updateDiscussionThread(updatedThread.id, JSON.stringify(updatedThread)).subscribe({
				next: (results) => {

					this.selectedThread = updatedThread;

					this.resetPostForm();
					this.reloadGridData();
				}
			});
		}
	}

	changeStatus(newStatus: string) {

		this.refsetService.updateDiscussionThreadStatus(this.selectedThread.id, newStatus).subscribe({
			next: (results) => {

				this.selectedThread.status = newStatus;
				this.isResolved = newStatus == this.RESOLVED;

				this.reloadGridData();
			}
		});
	}

	changeThreadPrivacy(thread: any, isPrivate: boolean) {

		this.refsetService.updateDiscussionThreadPrivacy(thread.id, isPrivate).subscribe({
			next: (results) => {

				thread.privateThread = isPrivate;
				thread.posts[0].privatePost = isPrivate;

				this.reloadGridData();
			}
		});
	}

	changeThreadVisibility(thread: any, visibility: string) {

		this.refsetService.updateDiscussionThreadVisibility(thread.id, visibility).subscribe({
			next: (results) => {

				thread.visibility = visibility;

				this.reloadGridData();
			}
		});
	}

	confirmThreadDelete() {
		this.openedConfirmModal = this.modalService.open(this.confirmDeleteThreadModal, { centered: true });
	}

	deleteThread() {

		this.openedConfirmModal.dismiss();

		this.refsetService.deleteDiscussionThread(this.selectedThread.id).subscribe({
			next: (results) => {

				this.threadsData.splice(this.threadsData.indexOf(this.selectedThread), 1);
				this.openedThreadModal.dismiss();
				this.reloadGridData();
			}
		});
	}

	changePostPrivacy(threadId: string, post: any, isPrivate: boolean) {

		this.refsetService.updateDiscussionPostPrivacy(threadId, post.id, isPrivate).subscribe({
			next: (results) => {
				post.privatePost = isPrivate;
			}
		});
	}

	changePostVisibility(threadId: string, post: any, visibility: string) {

		this.refsetService.updateDiscussionPostVisibility(threadId, post.id, visibility).subscribe({
			next: (results) => {
				post.visibility = visibility;
			}
		});
	}

	resetPostForm() {

		this.newThread = false;
		this.editThread = false;
		this.postPrivateField = false;
		this.postMessageField = '';
		this.postSubjectField = '';
		this.postButtonText = 'Reply';
	}

	reloadGridData() {

		this.gridApi.setRowData(this.threadsData);
		this.gridApi.redrawRows();
	}

	getPostText(message: string, truncate: boolean = true) {

		let strippedMessage = CodeUtility.stripHtml(message);

		if (truncate && strippedMessage.length > this.postTruncationLength) {
			return CodeUtility.shortenText(strippedMessage, this.postTruncationLength);
		} else {
			return message;
		}
	}

	canUserEditPost(post: any) {
		return this.canEditThread || post.user.userName == this.user.userName;
	}

	formatDate(date) {
		return CodeUtility.formatJsonDate(date, CodeUtility.DATE_FORMAT_REVERSE);
	}

	formatDateTime(date) {
		return CodeUtility.formatJsonDate(date, CodeUtility.DATE_FORMAT_REVERSE_WITH_24_HOUR_TIME);
	}
}
