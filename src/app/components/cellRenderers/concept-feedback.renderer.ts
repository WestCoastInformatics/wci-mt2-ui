import { Component, TemplateRef } from '@angular/core';
import {ICellRendererParams} from "ag-grid-community";

/**
 * @title Tree with nested nodes
 */
@Component({
    selector: 'app-renderer',
    template: '<ng-container #conceptFeedbackRenderer class="conceptFeedbackRenderer" [ngTemplateOutlet]="template" [ngTemplateOutletContext]="{$implicit: params}"></ng-container>'
})

export class ConceptFeedbackRenderer {

    params;
    dialogTemplate: TemplateRef<any>;
    template = undefined;
 
    agInit(params) {
        
        this.params = params;
        this.template = params.context.componentParent.agFeedbackSection;
    }
 }