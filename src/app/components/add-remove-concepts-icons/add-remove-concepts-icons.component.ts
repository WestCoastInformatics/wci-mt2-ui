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
	@Input() isParentConcept: boolean;
    @Output() processSelection = new EventEmitter<any>(true);

	constructor() {}

    ngOnInit(): void {}

	ngOnChanges(changes: SimpleChanges) {

		for (const propertyName in changes) {

            if (propertyName === "concept" && CodeUtility.hasValue(this.concept)) {

                if (!this.refsetType) {
                    this.actionText = "Member";
                } else if (this.refsetType != RefsetUtility.INTENSIONAL) {

                    this.actionText = "Member";
                    this.showAdd = !CodeUtility.testBoolean(this.concept.memberOfRefset);

                } else {

                    if (this.concept.definitionExceptionType != RefsetUtility.EXCLUSION && this.concept.definitionExceptionType != RefsetUtility.INCLUSION) {

                        if (CodeUtility.testBoolean(this.concept.memberOfRefset)) {

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
        
        console.time('testing');
        console.time('refset detail changeLockedStatus');
        console.time('comparison processChangedMemberEffects');
        console.time('comparison addRemoveConcept');
        console.time('comparison indicateChanges');
        console.time('add-remove addRemoveConcept before lock emit');
        console.time('add-remove addRemoveConcept before manageMemberNotifications');
        console.time('add-remove addRemoveConcept after lock emit');
        console.time('add-remove addRemoveConcept after manageMemberNotifications');
        this.processSelection.emit({addConcept: addConcept, concept: this.concept, isParentConcept: this.isParentConcept, definitionExceptionType: this.definitionExceptionType});
    }
}