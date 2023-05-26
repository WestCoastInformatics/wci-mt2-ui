import { Component } from '@angular/core';
import { AgFrameworkComponent } from 'ag-grid-angular';
import { IFloatingFilter, IFloatingFilterParams, TextFilter, TextFilterModel } from 'ag-grid-community';

export interface SelectFloatingFilterParams extends IFloatingFilterParams {
	selectedValue: string;
	names: Array<any>;
}

@Component({
	selector: 'app-category-floating-filter',
	templateUrl: 'category-filter.component.html',
	styleUrls: ['category-filter.component.scss'],
})
export class CategoryFilterComponent implements IFloatingFilter, AgFrameworkComponent<SelectFloatingFilterParams> {
	params: SelectFloatingFilterParams;
	currentValue;
	optionNum = 0;
	names: Array<any>;
	options: Array<SelectEntry> = [];
	selectedOption = this.options[0];
	placeholder = '';

	agInit(params: SelectFloatingFilterParams): void {
		this.params = params;
		this.placeholder = this.params.column.getUserProvidedColDef().headerName + ' ...';
		this.names = this.params.names;
		this.options.push(new SelectEntry(this.optionNum++, ''));

		for (let i = 0; i < this.names?.length; i++) {
			const entry = this.names[i];
			// If this is a Type Key Value property
			if (entry.hasOwnProperty('type') && (entry.hasOwnProperty('key') || entry.hasOwnProperty.call('name')) && entry.hasOwnProperty.call('value')) {
				const option: SelectEntry = new SelectEntry(this.optionNum++, entry.value, entry.name);
				this.options.push(option);
			} else {
				const option: SelectEntry = new SelectEntry(this.optionNum++, entry.name);
				this.options.push(option);
			}
		}
	}

	valueChanged() {
		const valueToUse = this.selectedOption.value != null ? this.selectedOption.value : '';
		const filterType = this.params.filterParams['defaultOption'] ?? 'equals';
		this.params.parentFilterInstance((instance: TextFilter) => instance.onFloatingFilterChanged(filterType, valueToUse === '' ? null : valueToUse));
	}

	onParentModelChanged(parentModel: TextFilterModel): void {
		if (!parentModel) {
			this.selectedOption = this.options[0];
		} else {
			const newFilterSelection = this.options.filter((opt) => opt.value === parentModel.filter);

			if (newFilterSelection.length > 0) {
				this.selectedOption = newFilterSelection[0];
			} else {
				this.selectedOption = this.options[0];
			}
		}
	}
}

class SelectEntry {
	public index: any;
	public label: string;
	public value: string;

	constructor(index: any, value: string, label: string = value) {
		this.index = index;
		this.label = label;
		this.value = value;
	}
}
