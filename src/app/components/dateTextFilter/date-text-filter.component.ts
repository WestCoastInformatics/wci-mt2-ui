import { Component } from '@angular/core';
import { AgFrameworkComponent } from 'ag-grid-angular';
import { IFloatingFilter, IFloatingFilterParams, TextFilter, TextFilterModel } from 'ag-grid-community';
import moment from 'moment';
import { CodeUtility } from 'src/app/utilities/code.utility';

export interface DateTextFloatingFilterParams extends IFloatingFilterParams {
	value: string;
}

@Component({
	standalone: false,
	selector: 'app-date-text-floating-filter',
	templateUrl: 'date-text-filter.component.html',
	styleUrls: ['./date-text-filter.component.css'],
})
export class DateTextFilterComponent implements IFloatingFilter, AgFrameworkComponent<DateTextFloatingFilterParams> {
	params: DateTextFloatingFilterParams;
	value = '';
	currentValue = '';

	agInit(params: DateTextFloatingFilterParams): void {
		this.params = params;
		this.value = this.params.value;
	}

	valueChanged(isSelector: boolean, event?: any, picker?: any) {
		if (isSelector) {
			picker._model.selection = '';
			this.value = moment(new Date(event.value)).format('YYYY-MM-DD');
		}
		let valueToUse;

		if (this.currentValue != '' && this.value == '') {
			valueToUse = null;
			this.currentValue = '';
		} else if (CodeUtility.isDateValid(this.value)) {
			valueToUse = this.value;
			this.currentValue = this.value;
		}

		if (valueToUse !== undefined) {
			this.params.parentFilterInstance((instance: TextFilter) => instance.onFloatingFilterChanged('equals', valueToUse));
		}
	}

	onParentModelChanged(parentModel: TextFilterModel): void {
		if (!parentModel) {
			this.value = '';
		} else {
			this.value = parentModel.filter;
		}
	}
}
