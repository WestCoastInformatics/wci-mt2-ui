import {
    ChangeDetectorRef,
    Component,
    EventEmitter,
    Input,
    OnInit,
    Output,
    SimpleChanges,
} from "@angular/core";
import { ThemePalette } from "@angular/material/core";
import { NgbModal } from "@ng-bootstrap/ng-bootstrap";
import { Debounce } from "src/app/decorators/debounce.decorator";
import { TreeOptions } from "src/app/models/tree-options.model";
import { RefsetService } from "src/app/services/rest/refset.service";
import { CodeUtility } from "src/app/utilities/code.utility";
import { RefsetUtility } from "src/app/utilities/refset.utility";
import { UiUtility } from "src/app/utilities/ui.utility";

@Component({
    selector: "add-remove-by-concept-modal",
    templateUrl: "./add-remove-by-concept-modal.component.html",
})
export class AddRemoveByConceptModalComponent implements OnInit {

    searchInput: string;
    searchResults = [];
    displayedColumns: string[] = ["memberOfRefset", "name", "description"];
    dataSource = [];
    color: ThemePalette = "primary";
    checked = false;
    showActiveConceptsOnly = true;
    initialResults = [];
    selectedRowIndex = -1;
    conceptDetailParents: any;
    selectedTaxonomyLanguage: string = RefsetUtility.DEFAULT_ACCEPT_LANGUAGE + ":"
        + RefsetUtility.DEFAULT_LANGUAGE_TYPE;
    taxonomyOptions: TreeOptions = {
        // onSelect: this.onTaxonomySelected.bind(this),
        useFsn: false,
        language: RefsetUtility.DEFAULT_ACCEPT_LANGUAGE,
    };
    conceptDetail: any;
    conceptDescriptions: any;
    editMode = true;
    showResults = false;
    conceptSelected: boolean;
    showLoadingSpinner = false;
    isConceptDetailsLoading = false;
    selectedConcept: any;
    numOfChildren = undefined;
    isConceptBeingAdded: Boolean;
    isAddRemoveInDetailsPanel: Boolean;
    addRemoveDefinitionExceptionType: string;
    conceptForAddRemove: any;
    refsetInternalId: string;

    @Input() refset: any;
    @Output() reloadPageData = new EventEmitter<boolean>();
    @Output() loadingSpinner = new EventEmitter<any>(true);

    constructor(
        private readonly modalService: NgbModal,
        private refsetService: RefsetService,
        private changeDetector: ChangeDetectorRef
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

    private sendReloadPageDataTrigger(value: boolean): void {
        this.reloadPageData.emit();
    }

    addRemoveConcept(params: any): void {

        this.isConceptBeingAdded = new Boolean(params.addConcept);

        // if this is coming from the parents section than the concept has children
        if (params.isInDetailsPanel) {
            params.concept.hasChildren = true;
        }

        this.conceptForAddRemove = params.concept;
        this.addRemoveDefinitionExceptionType = params.definitionExceptionType;
        this.isAddRemoveInDetailsPanel = params.isInDetailsPanel;
    }

    processChangedMemberEffects = () => {

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

    openAddRemoveModal(addRemoveConceptHierarchyModal: NgbModal) {

        this.refreshModal();
        this.modalService.open(addRemoveConceptHierarchyModal, {
            windowClass: "add-remove-concept-hierarchy-modal-size",
            animation: true,
            beforeDismiss: () => {
                this.refreshModal();
                return true;
            },
            backdrop: "static",
            keyboard: false,
        });
    }

    selectConcept(concept: any): void {

        this.conceptSelected = true;
        this.selectedConcept = concept;
        this.loadConceptDetail(concept);
    }

    loadConceptDetail(concept) {

        this.conceptDetail = null;
        this.isConceptDetailsLoading = true;
        this.loadConceptDetailParents(concept);

        this.refsetService
            .getMembersDetails(concept.code, {
                refsetInternalId: this.refsetInternalId,
            })
            .subscribe((results) => {

                this.isConceptDetailsLoading = false;
                this.conceptDetail = results;
                this.conceptDescriptions =
                    this.conceptDetail.descriptions.filter(function(description) {
                        return description != null;
                    });

                RefsetUtility.sortDescriptions(this.conceptDescriptions, this.refset.edition.fullyQualifiedLanguageRefsets);
            });
    }

    loadConceptDetailParents(concept) {

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
        this.refsetService
            .getConceptList(this.refsetInternalId, restParams)
            .subscribe((results) => {
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
        this.onTableSearchChange(false);
        this.conceptSelected = false;
        this.conceptDetail = null;
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

    setLoadSpinnerStatus($event): void {
        this.showLoadingSpinner = $event;
    }

    openEclBuilder(fieldId) {
        UiUtility.openEclBuilder(
            fieldId,
            RefsetUtility.getBranchPath(this.refset)
        );
    }

    @Debounce()
    onTableSearchChange(showLoadingSpinner = true) {
        
        if (
            !CodeUtility.hasValue(this.searchInput) ||
            (CodeUtility.hasValue(this.searchInput) &&
                this.searchInput.length > 2)
        ) {

            if (showLoadingSpinner) {
                this.loadingSpinner.emit(true);
            }
            
            this.refsetService
                .getConceptSearch(
                    this.refsetInternalId,
                    `limit=500&editing=true&offset=0&query=${this.searchInput}`
                )
                .subscribe(
                    (results) => {


                        this.dataSource = results.items;
                        this.initialResults = this.dataSource;
                        
                        // tslint:disable-next-line: no-unused-expression
                        if (results.items.length) {
                            this.changeModalSize();
                            this.showResults = true;
                        } else {
                            this.showResults = false;
                        }

                        this.filterActiveConcepts();

                        if (showLoadingSpinner) {
                            this.loadingSpinner.emit(false);
                        }
                    },
                    (error) => {

                        this.searchResults = [];
                        this.showResults = false;
                        this.loadingSpinner.emit(false);
                    }
                );
        }
    }
}
