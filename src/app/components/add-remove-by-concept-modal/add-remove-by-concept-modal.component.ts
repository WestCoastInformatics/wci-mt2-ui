import { Component, EventEmitter, Input, OnInit, Output } from '@angular/core';
import { ThemePalette } from '@angular/material/core';
import { NgbModal } from '@ng-bootstrap/ng-bootstrap';
import { Debounce } from 'src/app/decorators/debounce.decorator';
import { TreeOptions } from 'src/app/models/tree-options.model';
import { RefsetService } from 'src/app/services/rest/refset.service';
import { CodeUtility } from 'src/app/utilities/code.utility';
import { RefsetUtility } from 'src/app/utilities/refset.utility';

@Component({
    selector: "add-remove-by-concept-modal",
    templateUrl: './add-remove-by-concept-modal.component.html',
})
export class AddRemoveByConceptModalComponent implements OnInit {
    searchInput: string;
    searchResults = [];
    displayedColumns: string[] = ['memberOfRefset', 'name', 'description'];
    dataSource = [];
    color: ThemePalette = 'primary';
    checked = false;
    showActiveConceptsOnly = false;
    initialResults = [];
    conceptDetailParents: any;
    selectedTaxonomyLanguage: string =
        RefsetUtility.DEFAULT_ACCEPT_LANGUAGE +
        ':' +
        RefsetUtility.DEFAULT_LANGUAGE_TYPE;
    taxonomyOptions: TreeOptions = {
        // onSelect: this.onTaxonomySelected.bind(this),
        useFsn: false,
        language: RefsetUtility.DEFAULT_ACCEPT_LANGUAGE,
    };
    conceptDetail: any;
    conceptDescriptions: any;
    refsetData: any;
    editMode = true;
    showResults = false;
    conceptSelected: boolean;
    @Output()
    reloadGrid = new EventEmitter<boolean>();

    @Input()
    internalRefsetId: string;
    selectedConcept: any;
    showLoadingSpinner = false;
    isConceptDetailsLoading = false;

    constructor(
        private readonly modalService: NgbModal,
        private refsetService: RefsetService
    ) {}

    ngOnInit(): void {
        this.refsetService.getRefset(this.internalRefsetId).subscribe((results) => {
            this.refsetData = results;
        });
    }

    displayActiveConcepts($event: any): void {
        console.log($event);
        this.showActiveConceptsOnly = $event.checked;
        if (this.showActiveConceptsOnly) {
            this.dataSource = this.dataSource.filter((item) => {
                return item.active ? item : undefined;
            });
        } else {
            this.dataSource = this.initialResults;
        }
    }

    sendReloadGridTrigger(value: boolean): void {
        this.reloadGrid.emit(value);
    }

    addConcept(concept): void {
        this.showLoadingSpinner = true;
        this.refsetService
            .addRefsetMembers(this.internalRefsetId, 'list', concept.code.toString())
            .subscribe(
                (data) => {
                    console.log(data);
                    this.isConceptDetailsLoading = false;
                    this.sendReloadGridTrigger(true);
                    this.onTableSearchChange();
                    this.loadConceptDetail(this.selectedConcept.code.toString());
                    this.showLoadingSpinner = false;
                },
                (error) => {
                    console.log(error);
                    this.showLoadingSpinner = false;
                }
            );
    }

    removeConcept(concept): void {
        this.showLoadingSpinner = true;
        this.refsetService
            .removeRefsetMembers(this.internalRefsetId, 'list', concept.code.toString())
            .subscribe(
                (data) => {
                    console.log(data);
                    this.isConceptDetailsLoading = false;
                    this.sendReloadGridTrigger(true);
                    this.onTableSearchChange();
                    this.loadConceptDetail(this.selectedConcept.code.toString());
                    this.showLoadingSpinner = false;
                },
                (error) => {
                    console.log(error);
                    this.showLoadingSpinner = false;
                }
            );
    }

    openAddRemoveModal(addRemoveConceptHierarchyModal: NgbModal) {
        this.refreshModal();
        this.modalService.open(addRemoveConceptHierarchyModal, {
            windowClass: 'add-remove-concept-hierarchy-modal-size',
            animation: true,
            beforeDismiss: () => {
                this.refreshModal();
                return true;
            }
        });
    }

    changeModalSize(): void {
        const modalDialog = <HTMLElement> document.getElementsByClassName('modal-dialog')[0];
        if (modalDialog) {
            modalDialog.style.width = '1000px';
            modalDialog.style.maxWidth = '1240px';
        }

        const modalContent = <HTMLElement> document.getElementsByClassName('modal-content')[0];
        if (modalContent) {
            modalContent.style.height = '100%';
        }
    }

    refreshModal(): void {
        this.clearSearch();
        this.onTableSearchChange();
        this.conceptSelected = false;
    }

    clearSearch(): void {
        this.searchInput = '';
    }

    selectConcept(concept: any): void {
        this.conceptSelected = true;
        this.selectedConcept = concept;
        console.log(concept);
        this.isConceptDetailsLoading = true;
        this.loadConceptDetailParents(concept.code.toString());
        this.loadConceptDetail(concept.code.toString());
    }

    loadConceptDetail(concept) {
        this.conceptDetail = null;
        this.isConceptDetailsLoading = true;

        this.refsetService
            .getMembersDetails(concept, {
                refsetInternalId: this.internalRefsetId,
            })
            .subscribe((results) => {
                this.isConceptDetailsLoading = false;
                this.conceptDetail = results;
                this.conceptDescriptions =
                this.conceptDetail.descriptions.filter(function (
                        description
                    ) {
                        console.log(description)
                        return description != null;
                    });

                RefsetUtility.sortDescriptions(
                    this.conceptDescriptions,
                    this.refsetData.edition.fullyQualifiedLanguageRefsets
                );
            });

        this.loadConceptDetailParents(concept);
    }
    loadConceptDetailParents(conceptId) {
        const restParams = {
            displayType: 'taxonomy',
            returnChildren: false,
            language: this.getTaxonomyLanguageWithoutType(),
            depth: 1,
            startingConceptId: conceptId,
            offset: 0,
            limit: 1000,
        };

        // load the parents
        this.refsetService
            .getMembersList(this.internalRefsetId, restParams)
            .subscribe((results) => {
                this.conceptDetailParents = results.items;
            });
    }

    getTaxonomyLanguageWithoutType() {
        return this.selectedTaxonomyLanguage.replace(/:.*$/, '');
    }

    @Debounce()
    onTableSearchChange() {
        if (!CodeUtility.hasValue(this.searchInput) || (CodeUtility.hasValue(this.searchInput) && this.searchInput.length > 2)) {
            this.showLoadingSpinner = true;

          this.refsetService.getConceptSearch(this.internalRefsetId, `limit=500&offset=0&query=${this.searchInput}`).subscribe(results => {
            console.log(results.items);

            this.dataSource = results.items;
            this.initialResults = this.dataSource;
            // tslint:disable-next-line: no-unused-expression
            if (results.items.length) {
                this.changeModalSize();
                this.showResults = true;
            } else {
                this.showResults = false;
            }
            this.showLoadingSpinner = false;
          },
          error => {
              this.searchResults = [];
              this.showResults = false;
              console.log('errored out');
              console.log(this.searchInput);
              this.showLoadingSpinner = false;
          });
        }
    }
}
