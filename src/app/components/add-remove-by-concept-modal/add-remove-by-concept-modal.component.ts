import { Component, OnInit } from '@angular/core';
import { ThemePalette } from '@angular/material/core';
import { ActivatedRoute, Router } from '@angular/router';
import { NgbModal } from '@ng-bootstrap/ng-bootstrap';
import { Debounce } from 'src/app/decorators/debounce.decorator';
import { RefsetService } from 'src/app/services/rest/refset.service';
import { CodeUtility } from 'src/app/utilities/code.utility';

export interface PeriodicElement {
  name: string;
  position: number;
  weight: number;
}

const ELEMENT_DATA: PeriodicElement[] = [
  {position: 1, name: 'Hydrogen', weight: 1.0079},
  {position: 2, name: 'Helium', weight: 4.0026},
  {position: 3, name: 'Lithium', weight: 6.941},
  {position: 4, name: 'Beryllium', weight: 9.0122},
  {position: 5, name: 'Boron', weight: 10.811},
  {position: 6, name: 'Carbon', weight: 12.0107},
  {position: 7, name: 'Nitrogen', weight: 14.0067},
  {position: 8, name: 'Oxygen', weight: 15.9994},
  {position: 9, name: 'Fluorine', weight: 18.9984},
  {position: 10, name: 'Neon', weight: 20.1797},
  {position: 1, name: 'Hydrogen', weight: 1.0079},
  {position: 2, name: 'Helium', weight: 4.0026},
  {position: 3, name: 'Lithium', weight: 6.941},
  {position: 4, name: 'Beryllium', weight: 9.0122},
  {position: 5, name: 'Boron', weight: 10.811},
  {position: 6, name: 'Carbon', weight: 12.0107},
  {position: 7, name: 'Nitrogen', weight: 14.0067},
  {position: 8, name: 'Oxygen', weight: 15.9994},
  {position: 9, name: 'Fluorine', weight: 18.9984},
  {position: 10, name: 'Neon', weight: 20.1797},
  {position: 1, name: 'Hydrogen', weight: 1.0079},
  {position: 2, name: 'Helium', weight: 4.0026},
  {position: 3, name: 'Lithium', weight: 6.941},
  {position: 4, name: 'Beryllium', weight: 9.0122},
  {position: 5, name: 'Boron', weight: 10.811},
  {position: 6, name: 'Carbon', weight: 12.0107},
  {position: 7, name: 'Nitrogen', weight: 14.0067},
  {position: 8, name: 'Oxygen', weight: 15.9994},
  {position: 9, name: 'Fluorine', weight: 18.9984},
  {position: 10, name: 'Neon', weight: 20.1797},
  {position: 1, name: 'Hydrogen', weight: 1.0079},
  {position: 2, name: 'Helium', weight: 4.0026},
  {position: 3, name: 'Lithium', weight: 6.941},
  {position: 4, name: 'Beryllium', weight: 9.0122},
  {position: 5, name: 'Boron', weight: 10.811},
  {position: 6, name: 'Carbon', weight: 12.0107},
  {position: 7, name: 'Nitrogen', weight: 14.0067},
  {position: 8, name: 'Oxygen', weight: 15.9994},
  {position: 9, name: 'Fluorine', weight: 18.9984},
  {position: 10, name: 'Neon', weight: 20.1797},
  {position: 1, name: 'Hydrogen', weight: 1.0079},
  {position: 2, name: 'Helium', weight: 4.0026},
  {position: 3, name: 'Lithium', weight: 6.941},
  {position: 4, name: 'Beryllium', weight: 9.0122},
  {position: 5, name: 'Boron', weight: 10.811},
  {position: 6, name: 'Carbon', weight: 12.0107},
  {position: 7, name: 'Nitrogen', weight: 14.0067},
  {position: 8, name: 'Oxygen', weight: 15.9994},
  {position: 9, name: 'Fluorine', weight: 18.9984},
  {position: 10, name: 'Neon', weight: 20.1797},
  {position: 1, name: 'Hydrogen', weight: 1.0079},
  {position: 2, name: 'Helium', weight: 4.0026},
  {position: 3, name: 'Lithium', weight: 6.941},
  {position: 4, name: 'Beryllium', weight: 9.0122},
  {position: 5, name: 'Boron', weight: 10.811},
  {position: 6, name: 'Carbon', weight: 12.0107},
  {position: 7, name: 'Nitrogen', weight: 14.0067},
  {position: 8, name: 'Oxygen', weight: 15.9994},
  {position: 9, name: 'Fluorine', weight: 18.9984},
  {position: 10, name: 'Neon', weight: 20.1797},
];

@Component({
  selector: 'add-remove-by-concept-modal',
  templateUrl: './add-remove-by-concept-modal.component.html'
})
export class AddRemoveByConceptModalComponent implements OnInit {
  searchInput: string;
  searchResults = [];
  id: string;
  displayedColumns: string[] = ['addOrRemove', 'name', 'description'];
  dataSource = ELEMENT_DATA;
  color: ThemePalette = 'primary';
  checked = false;
  disabled = false;
  
  constructor(private readonly modalService: NgbModal,
    private refsetService: RefsetService,
    private route: ActivatedRoute,
    private router: Router) { }

  ngOnInit(): void {
    this.id = this.route.snapshot.paramMap.get('refsetId');
  }

  openAddRemoveModal(addRemoveConceptHierarchyModal: NgbModal) {
    this.modalService.open(addRemoveConceptHierarchyModal,  { windowClass : 'add-remove-concept-hierarchy-modal-size'});
  }

  clearSearch(): void {
    this.searchInput = '';
  }

  // @Debounce()
  // onTableSearchChange() {
  //     if (!CodeUtility.hasValue(this.searchInput) || (CodeUtility.hasValue(this.searchInput) && this.searchInput.length > 2)) {
  //         console.log(this.searchInput);

  //       this.refsetService.getConceptSearch(this.id, `?limit=500&offset=0&query=${this.searchInput}`).subscribe(results => {
  //         this.searchResults = results.items;
  //         console.log(this.searchResults);
  //       },
  //       error => {
  //           this.searchResults = [];
  //           console.log('errored out');
  //           console.log(this.searchInput);
  //       });
  //     }
  // }
}
