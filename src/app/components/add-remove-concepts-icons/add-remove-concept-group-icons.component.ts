import { Component, EventEmitter, Input, OnInit, Output, SimpleChanges } from '@angular/core';
import { CodeUtility } from 'src/app/utilities/code.utility';
import { Constants } from 'src/app/utilities/constants.utility';

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
    @Output() processSelection = new EventEmitter<any>(true);

    constructor() { }

    ngOnInit(): void { }

    ngOnChanges(changes: SimpleChanges) {

        for (const propertyName in changes) {

            if (propertyName === "concepts" && CodeUtility.hasValue(this.concepts)) {

                this.showAdd = this.addConcept;

                if (!this.refsetType) {
                    this.actionText = "Members";

                } else if (this.refsetType != Constants.INTENSIONAL) {
                    this.actionText = "Members";

                } else {

                    if (this.definitionExceptionType != Constants.EXCLUSION && this.definitionExceptionType != Constants.INCLUSION) {

                        if (this.addConcept) {
                            this.actionText = "Exclusions";
                        } else {
                            this.actionText = "Inclusions";
                        }

                    } else {

                        if (this.definitionExceptionType == Constants.EXCLUSION) {
                            this.actionText = "Exclusions";

                        } else if (this.definitionExceptionType == Constants.INCLUSION) {
                            this.actionText = "Inclusions";
                        }
                    }
                }
            }
        }
    }

    onSelection(addConcept: boolean) {
        this.processSelection.emit({ addConcept: addConcept, concepts: this.concepts, definitionExceptionType: this.definitionExceptionType });
    }
}