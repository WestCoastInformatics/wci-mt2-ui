import { Component, EventEmitter, Input, OnInit, Output, SimpleChanges, TemplateRef, ViewChild } from '@angular/core';
import { NgbModal, NgbModalRef } from '@ng-bootstrap/ng-bootstrap';
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
    canViewPrivateThreads = false;
    openedThreadListModal: NgbModalRef;
    openedThreadModal: NgbModalRef;
    openedConfirmModal: NgbModalRef;
    threadsData = [];
    selectedThread: any;
    selectedPost: any;
    displayHeader = 'Feedback';
    refsetGridOptions = {};
    canEditThread = false;
    canDeleteThread = false;
    editMode = '';
    isResolved = false;
    gridApi: any;
    gridColumnDefs = [];
    gridOptions: any;
    gridPaging = {
        pageSize: 10,
        pageSizeOptions: [10, 25, 50, 100],
        totalKnown: false,
        totalRows: null,
        manualStateRefresh: Boolean(true)
    };
    showTable = false;
    postTruncationLength = 500;
    tinyMceConfig = {
        base_url: '/tinymce',
        suffix: '.min',
        height: 200,
        menubar: false,
        auto_focus: 'postMessageField',
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
    privateCount = 0;

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
    @ViewChild('confirmDeletePostModal') confirmDeletePostModal: NgbModal;

    constructor(private readonly modalService: NgbModal, readonly refsetService: RefsetService, private authenticationService: AuthenticationService) {
    }

    ngOnInit() {

        this.user = this.authenticationService.getUser();
        this.isUserLoggedIn = this.user && this.user.userName != this.authenticationService.GUEST_USER;
        if (this.roles.includes('VIEWER') || this.roles.includes('ADMIN') || this.user.roles.includes('all-all-admin')) {
            this.canViewPrivateThreads = true;
        }
    }

    ngOnChanges(changes: SimpleChanges) {

        for (const propertyName in changes) {

            if (propertyName === 'refsetName' || propertyName === 'conceptName') {

                if (this.type == 'REFSET') {
                    this.displayHeader = 'Reference Set Feedback: ' + this.refsetName;
                } else {
                    this.displayHeader = 'Member Feedback: ' + this.conceptName + ' (' + this.conceptId + ') for Reference Set: ' + this.refsetName;
                }
            }
        }
    }

    openThreadListModal() {

        this.openedThreadListModal = this.modalService.open(this.threadListModal, {
            backdrop: 'static',
            keyboard: false,
            modalDialogClass: 'full-modal',
            centered: true
        });

        this.selectedThread = null;
        this.selectedPost = null;
        this.editMode = '';
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
            onFilterChanged: function () {
                if (this.api.getDisplayedRowCount() === 0) {
                    this.api.showNoRowsOverlay();
                } else {
                    this.api.hideOverlay();
                }
            },
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
                sortingOrder: ['asc', 'desc'],
                filter: true,
                floatingFilter: true,
                floatingFilterComponentParams: { placeholder: '', suppressFilterButton: false, suppressAndOrCondition: true },
            },
            enableBrowserTooltips: true,
            rowClassRules: {
                refset_tool_grid_inactive_row: function (params) {

                    let inactivatedRow = false;

                    if (params.data) {
                        inactivatedRow = params.data.active == false;
                    }

                    return inactivatedRow;
                },
            },
        };

        this.gridColumnDefs = [
            {
                field: 'id',
                headerName: 'Author',
                minWidth: 120,
                unSortIcon: true,
                tooltipValueGetter: (params) => {
                    return params?.data?.posts[0]?.user?.name;
                },
                cellRenderer: 'templateRenderer',
                cellRendererParams: { template: this.authorSection },
                valueGetter: (params) => {
                    return params?.data?.posts[0]?.user?.name;
                }
            },
            {
                field: 'subject',
                headerName: 'Feedback Topic',
                tooltipValueGetter: (params) => {
                    return params.data.subject;
                },
                flex: 2,
                minWidth: 300,
                unSortIcon: true,
                cellRenderer: 'templateRenderer',
                cellRendererParams: { template: this.subjectSection },
                valueGetter: (params) => {
                    return params.data.subject;
                }
            },
            {
                field: 'status',
                headerName: 'Status',
                maxWidth: 125,
                unSortIcon: true,
                tooltipValueGetter: (params) => {
                    return params.data.status;
                },
                floatingFilterComponent: 'categoryFilterComponent',
                floatingFilterComponentParams: {
                    names: [
                        { type: 'status', name: this.OPEN, value: this.OPEN },
                        { type: 'status', name: this.RESOLVED, value: this.RESOLVED }
                    ],
                    suppressFilterButton: true
                }
            },
            {
                field: 'lastPost',
                headerName: 'Last Comment',
                maxWidth: 210,
                unSortIcon: true,
                sort: 'desc',
                tooltipValueGetter: UiUtility.gridDateValueGetter,
                valueFormat: CodeUtility.DATE_FORMAT_REVERSE_WITH_TIME,
                valueGetter: UiUtility.gridDateValueGetter,
                floatingFilterComponent: 'dateTextFilterComponent', floatingFilterComponentParams: { suppressFilterButton: true }
            },
            {
                field: 'numberReplies', headerName: 'Replies', minWidth: 120, maxWidth: 150, unSortIcon: true, tooltipValueGetter: (params) => {
                    return params.data.numberReplies;
                }, resizable: false, filter: false
            }
        ];

    }

    onGridReady = (gridReadyParams) => {

        this.gridApi = gridReadyParams.api;

        // let conceptId = null;

        // if (CodeUtility.hasValue(this.conceptId)) {
        // 	conceptId = this.conceptId;
        // }

        this.refsetService.getDiscussionThreads(this.type, this.refsetInternalId, this.conceptId).subscribe({
            next: (results) => {
                this.privateCount = results.items.filter(t => t.privateThread).length;
                results.items = results.items.filter(t => !t.privateThread || (t.privateThread && (this.roles?.includes('ADMIN') || this.user.roles.includes('all-all-admin'))) ||
                    t.posts.length > 0 && (t.posts[0].user.userName === this.user.userName));
                results.total = results.items.length;
                results.totalKnown = true;
                this.threadsData = results.items;
                console.log(this.threadsData)
                const pageNumber = 1;

                if (results.items.length === 0) {
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
                UiUtility.applyGridPlaceholders('.ag-floating-filter-input .ag-input-field-input');
            },
            error: (error) => {

                this.gridApi.showNoRowsOverlay();
                this.gridApi.setRowData([]);
            }
        });
    }

    onGridCellClick = (event) => {
        for (const thread of this.threadsData) {
            if (thread.id === event.data.id) {
                this.selectedThread = thread;
                this.selectedThread.posts = this.selectedThread.posts.filter(p => !p.privatePost || p.user.userName === this.user.userName || (this.roles?.includes('ADMIN') || this.user.roles.includes('all-all-admin')));
            }
        }

        this.openThreadModal();
    }

    openThreadModal(newThread = false) {
        this.resetPostForm();

        if (newThread) {

            this.editMode = 'newThread';
            this.isResolved = false;
            this.selectedThread = null;
            this.postButtonText = 'Start Discussion';
            this.canEditThread = true;
            this.canDeleteThread = true;

        } else {

            this.isResolved = this.selectedThread.status == this.RESOLVED;
            this.postButtonText = 'Reply';

            if ((this.roles.includes('ADMIN') || this.user.roles.includes('all-all-admin')) || this.selectedThread.posts[0].user.userName == this.user.userName) {

                this.canEditThread = true;
                this.canDeleteThread = true;
            } else {

                this.canEditThread = false;
                this.canDeleteThread = false;
            }
        }

        this.openedThreadModal = this.modalService.open(this.threadModal, {
            modalDialogClass: 'full-modal',
            centered: true,
            backdrop: 'static',
            keyboard: false
        });
    }

    canEditPost(post) {

        return (this.roles.includes('ADMIN') || this.user.roles.includes('all-all-admin')) || post.user.userName === this.user.userName;
    }

    updatePost(post: any, editThread: boolean) {

        if (editThread) {

            this.editMode = 'editThread';
            this.postSubjectField = this.selectedThread.subject;
            this.postButtonText = 'Update Discussion';

        } else {

            this.selectedPost = post;
            this.editMode = 'editPost';
            this.postButtonText = 'Update Post';
        }

        this.postMessageField = post.message;
        this.postPrivateField = post.privatePost;

    }

    checkComplete() {

        let complete = this.postMessageField != '';

        if (this.editMode.includes('Thread')) {
            complete = complete && this.postSubjectField != '';
        }

        return complete;
    }

    saveChanges() {

        let post: any;

        if (this.selectedPost == null) {
            post = { message: this.postMessageField, privatePost: this.postPrivateField, visibility: this.VISIBLE };
        } else {

            post = CodeUtility.clone(this.selectedPost);
            post.message = this.postMessageField;
            post.privatePost = this.postPrivateField;
        }

        if (this.editMode == '') {

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

        } else if (this.editMode == 'editPost') {

            this.refsetService.updateDiscussionPost(this.selectedThread.id, this.selectedPost.id, JSON.stringify(post)).subscribe({
                next: (results) => {

                    this.selectedPost.message = this.postMessageField;
                    this.selectedPost.privatePost = this.postPrivateField;
                    this.selectedPost.modified = results.modified;

                    this.resetPostForm();
                    this.reloadGridData();
                }
            });

        } else if (this.editMode == 'newThread') {

            const thread: any = {
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
                    this.selectedThread.lastPost = results.created;
                    this.gridPaging.totalRows++;
                    this.discussionCount++;
                    this.discussionCountChange.emit(this.discussionCount);

                    this.resetPostForm();
                    this.reloadGridData();
                }
            });

        } else {

            const updatedThread = CodeUtility.clone(this.selectedThread);

            updatedThread.subject = this.postSubjectField;
            updatedThread.privateThread = this.postPrivateField;

            const updatedPost = updatedThread.posts[0];
            updatedPost.message = this.postMessageField;
            updatedPost.privatePost = this.postPrivateField;

            this.refsetService.updateDiscussionThread(updatedThread.id, JSON.stringify(updatedThread)).subscribe({
                next: (results) => {

                    this.selectedThread.subject = this.postSubjectField;
                    this.selectedThread.privateThread = this.postPrivateField;
                    this.selectedThread.posts[0].message = this.postMessageField;
                    this.selectedThread.posts[0].modified = results.posts[0].modified;
                    this.selectedThread.modified = results.modified;

                    this.resetPostForm();
                    this.reloadGridData();
                }
            });
        }
    }

    changeStatus(newStatus: string) {

        this.refsetService.updateDiscussionThreadStatus(this.selectedThread.id, newStatus).subscribe({
            next: (results) => {

                if (newStatus == 'Resolved') {
                    this.discussionCount--;
                } else {
                    this.discussionCount++;
                }
                this.discussionCountChange.emit(this.discussionCount);

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

    confirmThreadDelete() {
        this.openedConfirmModal = this.modalService.open(this.confirmDeleteThreadModal, { centered: true });
    }

    deleteThread() {

        this.openedConfirmModal.dismiss();
        this.openedConfirmModal = null;

        this.refsetService.deleteDiscussionThread(this.selectedThread.id).subscribe({
            next: (results) => {

                this.threadsData.splice(this.threadsData.indexOf(this.selectedThread), 1);
                this.gridPaging.totalRows--;
                this.discussionCount--;
                this.discussionCountChange.emit(this.discussionCount);
                this.openedThreadModal.dismiss();
                this.reloadGridData();
            }
        });
    }

    confirmPostDelete(post: any) {

        this.selectedPost = post;
        this.openedConfirmModal = this.modalService.open(this.confirmDeletePostModal, { centered: true });
    }

    deletePost() {

        this.openedConfirmModal.dismiss();
        this.openedConfirmModal = null;
        const postId = this.selectedPost.id;
        const postIndex = this.selectedThread.posts.indexOf(this.selectedPost);
        this.selectedPost = null;

        this.refsetService.deleteDiscussionPost(this.selectedThread.id, postId).subscribe({
            next: (results) => {

                this.selectedThread.posts.splice(postIndex, 1);
                this.selectedThread.numberReplies--;
                this.selectedThread.lastPost = this.selectedThread.posts[this.selectedThread.posts.length - 1].created;

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

    resetPostForm() {

        this.editMode = '';
        this.selectedPost = null;
        this.postPrivateField = false;
        this.postMessageField = '';
        this.postSubjectField = '';
        this.postButtonText = 'Reply';
    }

    reloadGridData() {

        this.gridApi.setRowData(this.threadsData);
        this.gridApi.redrawRows();
        // this.onGridReady({api: this.gridApi});
    }

    getPostText(message: string, truncate = true) {

        const strippedMessage = CodeUtility.stripHtml(message);

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
