import { Component, OnInit, TemplateRef } from '@angular/core';

@Component({
	selector: 'app-renderer',
	template: '<ng-container [ngTemplateOutlet]="template" [ngTemplateOutletContext]="{$implicit: params}"></ng-container>',
	standalone: false,
})
export class TemplateRendererComponent implements OnInit {
	constructor() {}
	public params;
	public template: TemplateRef<any>;
	public context: any = {};

	ngOnInit() {}

	agInit(params) {
		this.setTemplateAndParams(params);
	}

	refresh(params) {
		this.setTemplateAndParams(params);
	}

	setTemplateAndParams(params) {
		this.params = params;
		this.template = params.template;
		this.template = params['template'];
		this.context = {
			rowInfo: {
				rowData: params.data,
				rowId: params.node.id,
			},
		};
	}
}
