import {
    ChangeDetectorRef,
    Component,
    EventEmitter,
    Input,
    OnInit,
    Output,
    SimpleChanges,
    TemplateRef,
    ViewChild,
} from "@angular/core";
import { ThemePalette } from "@angular/material/core";
import { NgbModal, NgbModalRef } from "@ng-bootstrap/ng-bootstrap";
import { Router } from '@angular/router';
import { Debounce } from "src/app/decorators/debounce.decorator";
import { TreeOptions } from "src/app/models/tree-options.model";
import { RefsetService } from "src/app/services/rest/refset.service";
import { CodeUtility } from "src/app/utilities/code.utility";
import { RefsetUtility } from "src/app/utilities/refset.utility";
import { UiUtility } from "src/app/utilities/ui.utility";
import { environment } from 'src/environments/environment';
import { RefsetDetails } from 'src/app/pages/refset-details';
import { NotificationService } from "src/app/services/notification.service";

@Component({
    selector: "add-remove-by-concept-modal",
    templateUrl: "./add-remove-by-concept-modal.component.html",
    styleUrls: ["./add-remove-by-concept-modal.component.scss"]
})
export class AddRemoveByConceptModalComponent implements OnInit {

    searchInput: string;
    searchResults = [];
    displayedColumns: string[] = ["memberOfRefset", "name", "description"];
    dataSource = [];
    conceptIdArray = [];
    color: ThemePalette = "primary";
    checked = false;
    showActiveConceptsOnly = true;
    initialResults = [];
    selectedRowIndex = -1;
    selectedTaxonomyLanguage: string = RefsetUtility.DEFAULT_ACCEPT_LANGUAGE + ":" + RefsetUtility.DEFAULT_LANGUAGE_TYPE;
    taxonomyOptions: TreeOptions = {
        useFsn: false,
        language: RefsetUtility.DEFAULT_ACCEPT_LANGUAGE,
    };
    conceptDescriptions: any;
    editMode = true;
    showResults = false;
    conceptSelected: boolean;
    showLoadingSpinner = false;
    isConceptDetailsLoading = false;
    conceptDetail: any;
    conceptDetailParents: any;
    selectedConcept: any;
    numOfChildren = undefined;
    isConceptBeingAdded: Boolean;
    addRemoveDefinitionExceptionType: string;
    conceptForAddRemove: any;
    refsetInternalId: string;
    openedModel: NgbModalRef;
    isLocked = false;
    showNoResultsLabel = false;
    eclString: any;

    @Input() refset: any;
    @Output() loadingSpinner = new EventEmitter<boolean>(true);
    @Output() changeLockedStatus = new EventEmitter<boolean>(true);

    constructor(
        private readonly modalService: NgbModal,
        private refsetService: RefsetService,
        private notificationService: NotificationService,
        private router: Router,
        private readonly refsetDetails: RefsetDetails
    ) {}

    ngOnInit(): void {
    }

    ngOnChanges(changes: SimpleChanges) {

		for (const propertyName in changes) {

			if (propertyName === "refset" && CodeUtility.hasValue(this.refset)) {
				
                this.refsetInternalId = this.refset.id;
			}
		}
	}

    toggleDisplayActiveConcepts($event: any): void {

        this.showActiveConceptsOnly = $event.checked;
        this.filterActiveConcepts();
    }

    filterActiveConcepts(): void {

        if (this.showActiveConceptsOnly) {

            this.dataSource = this.dataSource.filter((item) => {
                return item.active ? item : undefined;
            });
        } else {
            this.dataSource = this.initialResults;
        }
    }


    addRemoveConcept(params: any): void {

        this.isConceptBeingAdded = new Boolean(params.addConcept);

        // if this is coming from the parents section than the concept has children
        if (params.isParentConcept) {
            params.concept.hasChildren = true;
        }

        this.conceptForAddRemove = params.concept;
        this.addRemoveDefinitionExceptionType = params.definitionExceptionType;
    }

    public processChangedMemberEffects = (conceptStatusArray) => {

        this.isLocked = false;
        UiUtility.toggleLockedSections(false);

        // if this modal is closed and the same refset is still open then refsesh the page
        if (!this.modalService.hasOpenModals() && this.router.url.includes('/' + this.refset.refsetId)) {
            this.refsetDetails.ngOnInit();
        }

        // reload the search results
        this.onTableSearchChange();

        // reload the concept details if it is open
        if (this.conceptDetail != null) {
            this.loadConceptDetail(this.conceptDetail);
        }

    }

    sendLoadingSpinnerTrigger = (value: any) => {
        this.loadingSpinner.emit(value);
    }

    sendChangeLockedStatus = (value: boolean) => {

        this.isLocked = value;
        this.changeLockedStatus.emit(value);
    }

    openAddRemoveModal(addRemoveConceptHierarchyModal: NgbModal) {

        this.openedModel = this.modalService.open(addRemoveConceptHierarchyModal, {
            windowClass: "add-remove-concept-hierarchy-modal-size",
            animation: true,
            beforeDismiss: () => {
                if (!this.isLocked) {
                    this.refsetDetails.ngOnInit();
                }
                this.refreshModal();
                return true;
            }
            //backdrop: "static",
            //keyboard: false,
        });

    }

    closeModal() {

        if (!this.isLocked) {
            this.refsetDetails.ngOnInit();
        }

        this.openedModel.dismiss();
    }

    selectConcept(concept: any): void {

        this.conceptSelected = true;
        this.selectedConcept = concept;
        this.loadConceptDetail(concept);
    }

    loadConceptDetail(concept) {

        this.conceptDetail = null;
        this.isConceptDetailsLoading = true;
        this.showLoadingSpinner = true;
        this.loadConceptDetailParents(concept);

        this.refsetService
            .getMembersDetails(concept.code, {
                refsetInternalId: this.refsetInternalId,
            })
            .subscribe((results) => {

                this.isConceptDetailsLoading = false;
                this.showLoadingSpinner = false;
                this.conceptDetail = results;
                this.conceptDescriptions =
                    this.conceptDetail.descriptions.filter(function(description) {
                        return description != null;
                    });

                RefsetUtility.sortDescriptions(this.conceptDescriptions, this.refset.edition.fullyQualifiedLanguageRefsets);
            });
    }

    loadConceptDetailParents(concept) {

        this.conceptDetailParents = [];

        if (!concept?.active) {
            return;
        }

        const restParams = {
            displayType: "taxonomy",
            returnChildren: false,
            language: this.getTaxonomyLanguageWithoutType(),
            depth: 1,
            startingConceptId: concept.code,
            offset: 0,
            limit: 1000,
        };

        // load the parents
        this.refsetService.getConceptList(this.refsetInternalId, restParams).subscribe((results) => {
            this.conceptDetailParents = results.items;
        });
    }

    changeModalSize(): void {
        const modalDialog = <HTMLElement>(
            document.getElementsByClassName("modal-dialog")[0]
        );
        if (modalDialog) {
            modalDialog.style.width = "1000px";
            modalDialog.style.maxWidth = "1240px";
        }

        const modalContent = <HTMLElement>(
            document.getElementsByClassName("modal-content")[0]
        );
        if (modalContent) {
            modalContent.style.height = "100%";
        }
    }

    refreshModal(): void {

        this.clearSearch();
        this.isLocked = false;
        this.conceptSelected = false;
        this.conceptDetail = null;
        this.showResults = false;
        this.showNoResultsLabel = false;
    }

    clearSearch(): void {
        this.searchInput = '';
    }

    highlight(row) {
        this.selectedRowIndex = row.id;
    }

    getTaxonomyLanguageWithoutType() {
        return this.selectedTaxonomyLanguage.replace(/:.*$/, "");
    }

    openEclBuilder(fieldId) {
        UiUtility.openEclBuilder(fieldId, RefsetUtility.getBranchPath(this.refset));
    }

    addRemoveAllMembers(type) {
        for (var i=0; i<this.dataSource.length; i++) {
          this.conceptIdArray.push(this.dataSource[i].code);
        }
        
        RefsetUtility.addRemoveMembersByList(this.refset.id, this.refset.refsetId, this.conceptIdArray.join(), type, this.processChangedMemberEffects, this.notificationService, this.refsetService, this.router);
        
        this.closeModal();

    }

    @Debounce()
    onTableSearchChange(showLoadingSpinner = true) {

        if (CodeUtility.hasValue(this.searchInput) || (CodeUtility.hasValue(this.searchInput) && this.searchInput.length > 2)) {

            if (showLoadingSpinner) {
                this.loadingSpinner.emit(true);
            }

            this.refsetService.getConceptSearch(this.refsetInternalId, `limit=500&editing=true&offset=0&query=${encodeURI(this.searchInput)}`).subscribe({next: (results) => {

                this.dataSource = results.items;
                this.initialResults = this.dataSource;

                // tslint:disable-next-line: no-unused-expression
                if (results.items.length) {

                    this.changeModalSize();
                    this.showResults = true;
                    this.showNoResultsLabel = false;
                } else {
                    
                    this.showResults = false;
                    this.showNoResultsLabel = true;
                }
                this.filterActiveConcepts();

                if (showLoadingSpinner) {
                    this.loadingSpinner.emit(false);
                }
            },
            error: (error) => {

                this.searchResults = [];
                this.showResults = false;
                this.loadingSpinner.emit(false);
            }});
        }
    }
}
