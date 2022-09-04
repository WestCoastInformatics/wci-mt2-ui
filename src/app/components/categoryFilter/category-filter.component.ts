import { Component } from '@angular/core';
import { AgFrameworkComponent } from 'ag-grid-angular';
import { IFloatingFilter, IFloatingFilterParams, TextFilter, TextFilterModel } from 'ag-grid-community';

export interface SelectFloatingFilterParams extends IFloatingFilterParams {

	selectedValue: string;
	names: Array<any>;
}

@Component({
	selector: 'app-category-floating-filter',
	templateUrl: 'category-filter.component.html'
})
export class CategoryFilterComponent implements IFloatingFilter, AgFrameworkComponent<SelectFloatingFilterParams> {

	params: SelectFloatingFilterParams;
	currentValue;
	optionNum = 0;
	names: Array<any>;
	options: Array<SelectEntry> = [];
	selectedOption = this.options[0];

	agInit(params: SelectFloatingFilterParams): void {

		this.params = params;
		this.names = this.params.names;
		this.options.push(new SelectEntry(this.optionNum++, ''));

		for (let i = 0; i < this.names?.length; i++) {

			const entry = this.names[i];
			// If this is a Type Key Value property
			if (entry.hasOwnProperty('type') && (entry.hasOwnProperty('key') || entry.hasOwnProperty('name')) && entry.hasOwnProperty('value')) {

				if (entry.type === 'status') {

					const option: SelectEntry = new SelectEntry(this.optionNum++, entry.value, entry.name);
					this.options.push(option);
				} else {

					const option: SelectEntry = new SelectEntry(this.optionNum++, entry.value.charAt(0) + entry.value.slice(1).toLowerCase());
					this.options.push(option);
				}
			} else {

				const option: SelectEntry = new SelectEntry(this.optionNum++, entry.name.charAt(0) + entry.name.slice(1).toLowerCase());
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
			this.selectedOption.value = '';
		} else {
            if (!this.selectedOption) {
                this.selectedOption = this.options.filter(opt => opt.value === parentModel.filter)[0];
            }
			this.selectedOption.value = parentModel.filter;
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
