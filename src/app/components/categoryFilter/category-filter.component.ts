import { Component, OnInit } from '@angular/core';
import { AgFrameworkComponent } from 'ag-grid-angular';
import { FilterChangedEvent, IAfterGuiAttachedParams, IFloatingFilter, IFloatingFilterParams, TextFilter, TextFilterModel } from 'ag-grid-community';

export interface SelectFloatingFilterParams extends IFloatingFilterParams {
  selectedValue: string;
}

@Component({
  selector: 'app-category-floating-filter',
    templateUrl: 'category-filter.component.html'
})
export class CategoryFilterComponent implements IFloatingFilter, AgFrameworkComponent<SelectFloatingFilterParams> {
  params: SelectFloatingFilterParams;
  currentValue: string;

agInit(params: SelectFloatingFilterParams): void {
	console.log("^^^^^^ agInit ", params);
    this.params = params;
    this.currentValue = this.params.selectedValue;
  }

  valueChanged() {
	console.log("^^^^^^ valueChanged ", this.currentValue);
    let valueToUse = this.currentValue === '' ? null : this.currentValue;
    this.params.parentFilterInstance((instance: TextFilter) =>
      instance.onFloatingFilterChanged('equals', valueToUse === '' ? null : valueToUse));
  }

  onParentModelChanged(parentModel: TextFilterModel): void {
	console.log("^^^^^^ onParentModelChanged ", parentModel.filter);
    if (!parentModel) {
      this.currentValue = "";
    }
    else {
      this.currentValue = parentModel.filter;
    }
  }
}