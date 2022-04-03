import { Component, EventEmitter, Input, OnInit, Output, SimpleChanges } from '@angular/core';
import { CodeUtility } from 'src/app/utilities/code.utility';
import { RefsetUtility } from 'src/app/utilities/refset.utility';

@Component({
	selector: 'add-remove-concept-group-icons',
	templateUrl: './add-remove-concepts-icons.component.html'
})
export class AddRemoveConceptGroupIconsComponent implements OnInit {

	actionText: string;
    showAdd: boolean

    @Input() definitionExceptionType: string;
	@Input() refsetType: string;
	@Input() additionalClasses: string;
	@Input() concepts: string[];
	@Input() addConcept: boolean;
	@Input() hidden: boolean = false;
	@Input() isParentConcept: boolean;
    @Output() processSelection = new EventEmitter<any>(true);

	constructor() {}

    ngOnInit(): void {}

	ngOnChanges(changes: SimpleChanges) {

		for (const propertyName in changes) {

            if (propertyName === "concepts" && CodeUtility.hasValue(this.concepts)) {

                this.showAdd = this.addConcept;

                if (!this.refsetType) {
                    this.actionText = "Members";

                } else if (this.refsetType != RefsetUtility.INTENSIONAL) {
                    this.actionText = "Members";

                } else {

                    if (this.definitionExceptionType != RefsetUtility.EXCLUSION && this.definitionExceptionType != RefsetUtility.INCLUSION) {

                        if (this.addConcept) {
                            this.actionText = "Exclusions";
                        } else {
                            this.actionText = "Inclusions";
                        }

                    } else {

                        if (this.definitionExceptionType == RefsetUtility.EXCLUSION) {
                            this.actionText = "Exclusions";
            
                        } else if (this.definitionExceptionType == RefsetUtility.INCLUSION) {
                            this.actionText = "Inclusions";
                        }
                    }
                }
            }
        }
	}

    onSelection(addConcept: boolean) {
        this.processSelection.emit({addConcept: addConcept, concept: this.concepts, isParentConcept: this.isParentConcept, definitionExceptionType: this.definitionExceptionType});
    }
}