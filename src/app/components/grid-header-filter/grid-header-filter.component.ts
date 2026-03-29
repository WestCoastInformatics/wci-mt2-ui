import { Component } from '@angular/core';
import { AgFrameworkComponent } from 'ag-grid-angular';
import { IFloatingFilter, IFloatingFilterParams, TextFilter, TextFilterModel } from 'ag-grid-community';
import moment from 'moment';
import { CodeUtility } from 'src/app/utilities/code.utility';

export interface GridHeaderFloatingFilterParams extends IFloatingFilterParams {
	value: string;
	placeholder: string;
}

@Component({
	standalone: false,
	selector: 'app-grid-header-floating-filter',
	templateUrl: 'grid-header-filter.component.html',
	styleUrls: ['./grid-header-filter.component.css'],
})
export class GridHeaderFilterComponent implements IFloatingFilter, AgFrameworkComponent<GridHeaderFloatingFilterParams> {
	params: GridHeaderFloatingFilterParams;
	value = '';
	currentValue = '';
	placeholder = '';

	agInit(params: GridHeaderFloatingFilterParams): void {
		this.params = params;
		this.value = this.params.value;
		this.placeholder = this.params.placeholder;
		//this.placeholder = this.params.column.getUserProvidedColDef().headerName + ' ...';
	}

	valueChanged() {
		let valueToUse;

		if (this.currentValue != '' && this.value == '') {
			valueToUse = null;
			this.currentValue = '';
		} else {
			valueToUse = this.value;
			this.currentValue = this.value;
		}

		if (valueToUse !== undefined) {
			this.params.parentFilterInstance((instance: TextFilter) => instance.onFloatingFilterChanged('equals', valueToUse));
		}
	}

	clearValue() {
		this.value = '';
		this.valueChanged();
	}

	onParentModelChanged(parentModel: TextFilterModel): void {
		if (!parentModel) {
			this.value = '';
		} else {
			this.value = parentModel.filter;
		}
	}
}
