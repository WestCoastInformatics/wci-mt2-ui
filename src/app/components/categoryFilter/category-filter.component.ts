import { Component, OnInit } from '@angular/core';
import { AgFrameworkComponent } from 'ag-grid-angular';
import { IFloatingFilter, IFloatingFilterParams, TextFilter, TextFilterModel } from 'ag-grid-community';

export interface SelectFloatingFilterParams extends IFloatingFilterParams {
  selectedValue: string;
  names:Array<any>;
}

@Component({
  selector: 'app-category-floating-filter',
    templateUrl: 'category-filter.component.html'
})
export class CategoryFilterComponent implements IFloatingFilter, AgFrameworkComponent<SelectFloatingFilterParams> {
  params: SelectFloatingFilterParams;
  currentValue;
  
 optionNum:number = 0;
  names:Array<any>;
  options:Array<SelectEntry> = [];

  selectedOption = this.options[0];



  agInit(params: SelectFloatingFilterParams): void {
    this.params = params;
    this.names = this.params.names;
	console.log("^^^^^^ agInit ", this.names?.values);
	let obj: SelectEntry = new SelectEntry(this.optionNum++, "");
    this.options.push(obj);
	for (let i = 0; i < this.names?.length; i++) {
        let entry = this.names[i];
    	let obj: SelectEntry = new SelectEntry(this.optionNum++, entry.value.charAt(0) + entry.value.slice(1).toLowerCase());
    	this.options.push(obj);
	}
	console.log(this.options)
  }

  valueChanged() {
	console.log("^^^^^^ valueChanged ", this.selectedOption);
	let valueToUse = this.selectedOption.name != null ? this.selectedOption.name : "";
    //let valueToUse = this.currentValue === '' ? null : this.selectedOption.name;
    this.params.parentFilterInstance((instance: TextFilter) =>
      instance.onFloatingFilterChanged('equals', valueToUse === '' ? null : valueToUse));
  }

  onParentModelChanged(parentModel: TextFilterModel): void {

    if (!parentModel) {
      this.selectedOption.name = "";
    }
    else {
      this.selectedOption.name = parentModel.filter;
    }
  }
}

class SelectEntry{

  public num: any;
  public name: string;

  constructor(num: any, name: string){
    this.num = num;
    this.name = name;
  }

}
