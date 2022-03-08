import { Component, EventEmitter, Input, OnInit, Output, SimpleChanges } from '@angular/core';
import { CodeUtility } from 'src/app/utilities/code.utility';
import { RefsetUtility } from 'src/app/utilities/refset.utility';

@Component({
	selector: 'add-remove-concepts-icons',
	templateUrl: './add-remove-concepts-icons.component.html'
})
export class AddRemoveConceptsIconsComponent implements OnInit {

	actionText: string;
    showAdd: boolean;
    definitionExceptionType: string;

	@Input() refsetType: string;
	@Input() additionalClasses: string;
	@Input() concept: any;
	@Input() hidden: boolean = false;
	@Input() isInDetailsPanel: boolean;
    @Output() processSelection = new EventEmitter<any>(true);

	constructor() {}

    ngOnInit(): void {}

	ngOnChanges(changes: SimpleChanges) {

		for (const propertyName in changes) {

            if (propertyName === "concept" && CodeUtility.hasValue(this.concept)) {

                if (this.refsetType != RefsetUtility.INTENSIONAL) {

                    this.actionText = "Member";
                    this.showAdd = !this.concept.memberOfRefset;

                } else {

                    if (this.concept.definitionExceptionType != RefsetUtility.EXCLUSION && this.concept.definitionExceptionType != RefsetUtility.INCLUSION) {

                        if (this.concept.memberOfRefset) {

                            this.actionText = "Exclusion";
                            this.definitionExceptionType = RefsetUtility.EXCLUSION;
                            this.showAdd = true;

                        } else {

                            this.actionText = "Inclusion";
                            this.definitionExceptionType = RefsetUtility.INCLUSION;
                            this.showAdd = true;
                        }

                    } else {

                        this.definitionExceptionType = this.concept.definitionExceptionType

                        if (this.definitionExceptionType == RefsetUtility.EXCLUSION) {

                            this.actionText = "Exclusion";
                            this.showAdd = false;
            
                        } else if (this.definitionExceptionType == RefsetUtility.INCLUSION) {
            
                            this.actionText = "Inclusion";
                            this.showAdd = false;
                        }
                    }
                }
            }
        }
	}

    onSelection(addConcept: boolean) {
        this.processSelection.emit({addConcept: addConcept, concept: this.concept, isInDetailsPanel: this.isInDetailsPanel, definitionExceptionType: this.definitionExceptionType});
    }
}