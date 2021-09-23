import { ChangeDetectorRef, Component, EventEmitter, OnInit, Output } from '@angular/core';
import { ThemePalette } from '@angular/material/core';
import { ActivatedRoute, Router } from '@angular/router';
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
    id: string;
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

    constructor(
        private readonly modalService: NgbModal,
        private refsetService: RefsetService,
        private route: ActivatedRoute,
        private router: Router,
        private readonly changeDetection: ChangeDetectorRef
    ) {}

    ngOnInit(): void {
        this.id = this.route.snapshot.paramMap.get('refsetId');
        this.refsetService.getRefset(this.id).subscribe((results) => {
            this.refsetData = results;
        });
        const restParams: any = {
            sortModel: '',
            limit: 500,
            offset: 0,
            displayType: 'list',
        };
        // this.refsetService
        //     .getMembersList(this.id, restParams)
        //     .subscribe((results) => {
        //         console.log(results.items);

        //         this.dataSource = results.items;
        //         this.initialResults = this.dataSource;
        //     });
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

    addConcept(concept): void {
        this.refsetService
            .addRefsetMembers(this.id, 'list', concept.code.toString())
            .subscribe(
                (data) => {
                    console.log(data);
                    console.log(concept);
                },
                (error) => {
                    console.log(error);
                }
            );
    }

    removeConcept(concept): void {
        this.refsetService
            .removeRefsetMembers(this.id, 'list', concept.code.toString())
            .subscribe(
                (data) => {
                    console.log(data);
                    console.log(concept);
                },
                (error) => {
                    console.log(error);
                }
            );
    }

    openAddRemoveModal(addRemoveConceptHierarchyModal: NgbModal) {
        this.modalService.open(addRemoveConceptHierarchyModal, {
            windowClass: 'add-remove-concept-hierarchy-modal-size'
        });
    }

    clearSearch(): void {
        this.searchInput = '';
    }

    selectConcept(concept: any): void {
        this.conceptSelected = true;
        console.log(concept);
        this.loadConceptDetailParents(concept.code.toString());
        this.loadConceptDetail(concept.code.toString());
    }

    loadConceptDetail(concept) {
        this.conceptDetail = null;

        this.refsetService
            .getMembersDetails(concept, {
                refsetInternalId: this.id,
            })
            .subscribe((results) => {
                this.conceptDetail = results;
                this.conceptDescriptions =
                    this.conceptDetail.descriptions.filter(function (
                        description
                    ) {
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
            .getMembersList(this.id, restParams)
            .subscribe((results) => {
                this.conceptDetailParents = results.items;
                console.log(this.conceptDetailParents);
            });
    }

    getTaxonomyLanguageWithoutType() {
        return this.selectedTaxonomyLanguage.replace(/:.*$/, '');
    }

    @Debounce()
    onTableSearchChange() {
        if (!CodeUtility.hasValue(this.searchInput) || (CodeUtility.hasValue(this.searchInput) && this.searchInput.length > 2)) {
            console.log(this.searchInput);

          this.refsetService.getConceptSearch(this.id, `limit=500&offset=0&query=${this.searchInput}`).subscribe(results => {
            console.log(results.items);

            this.dataSource = results.items;
            this.initialResults = this.dataSource;
            // tslint:disable-next-line: no-unused-expression
            if (results.items.length) {
                this.showResults = true;
            } else {
                this.showResults = false;
            }
          },
          error => {
              this.searchResults = [];
              this.showResults = false;
              console.log('errored out');
              console.log(this.searchInput);
          });
        }
    }
}
