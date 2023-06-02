import { Component } from '@angular/core';

/**
 * @title Tree with nested nodes
 */
@Component({
	selector: 'app-renderer',
	template: '<ng-container [ngTemplateOutlet]="template" [ngTemplateOutletContext]="{$implicit: params}"></ng-container>',
})
export class TemplateRenderer {
	params;
	template = undefined;

	agInit(params) {
		this.params = params;
		this.template = params.template;
	}
}
