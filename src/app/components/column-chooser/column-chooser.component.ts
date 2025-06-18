import { Component, Input, TemplateRef, ViewChild, ViewEncapsulation } from '@angular/core';
import { DialogFactoryService } from 'src/app/dialog/services/dialog-factory.service';
import { DialogService } from 'src/app/dialog/services/dialog.service';
import { CodeUtility } from 'src/app/utilities/code.utility';

/**
 * @title Tree with nested nodes
 */
@Component({
	selector: 'app-column-chooser',
	templateUrl: './column-chooser.component.html',
	styleUrls: ['./column-chooser.component.scss'],
	encapsulation: ViewEncapsulation.None,
})
export class ColumnChooserComponent {
	dialog: DialogService;

	columns = [];
	selectedColumns = [];
	@Input() gridColumnApi;
	@Input() disabled = false;
	@Input() useDialog = true;
	@Input() manualStateRefresh = false;
	@Input() columnStorage;
	@ViewChild('columnChooserSection') columnChooserDialog: TemplateRef<any>;

	constructor(private dialogFactoryService: DialogFactoryService) {}

	ngOnChanges() {
		if (this.gridColumnApi?.columnModel?.columnDefs) {
			// make sure not to lose previous column selections
			const previousColumns = this.columns;
			this.columns = [];

			if (this.columns.length > 0) {
				this.selectedColumns = [];
			}

			const detectChanges = false;

			for (const column of this.gridColumnApi.columnModel.columnDefs) {
				// Avoid these coluns (they are icon columns without titles)
				if (column.headerName == '' || !column.headerName) {
					continue;
				}

				const columnData: any = {};

				if (!column.colId) {
					columnData.colId = column.field;
				} else {
					columnData.colId = column.colId;
				}

				if (CodeUtility.hasValue(column.headerName)) {
					columnData.name = column.headerName;
				} else {
					columnData.name = columnData.colId;
				}

				const previousColumn = previousColumns.find((element) => element.colId == columnData.colId);

				// apply previous column selections if there were any
				if (previousColumn) {
					columnData.show = previousColumn.show;

					if (columnData.show) {
						this.selectedColumns.push(columnData);
					}
				} else if (!column.hasOwnProperty('hide') || column.hide == false) {
					columnData.show = true;
				} else {
					columnData.show = false;
				}

				this.columns.push(columnData);
			}

			if (this.columnStorage) {
				const columnSelection = sessionStorage.getItem(this.columnStorage);

				if (columnSelection) {
					const columnsSelected = JSON.parse(columnSelection);
					if (columnsSelected.hasOwnProperty('state')) {
						this.gridColumnApi.applyColumnState(columnsSelected);
						const storedState = columnsSelected.state;
						storedState.forEach((selectCol) => {
							this.columns.forEach((col) => {
								if (selectCol.colId == col.colId) {
									if (selectCol.hide) {
										col.show = false;
									} else {
										col.show = true;
										this.selectedColumns.push(col);
									}
								}
							});
						});
					}
				}
			}
			if (this.selectedColumns.length == 0) {
				this.selectedColumns = JSON.parse(JSON.stringify(this.columns));
			}
		}
	}

	openColumnChooser() {
		const dialogId = 'columnChooserDialog';

		const dialogData = {
			dialogId: dialogId,
			showCancel: false,
			confirmText: 'Okay',
			headerText: 'Select which columns to display:',
			template: this.columnChooserDialog,
			data: this.columns,
			showCloseIcon: false,
		};

		const dialogOptions = {
			id: dialogId,
			width: '500px',
			disableClose: false,
		};

		this.dialog = this.dialogFactoryService.open(dialogData, dialogOptions);

		this.dialog.confirmed().subscribe((data) => {
			this.columns = data;

			if (data) {
				this.applyColumns();
			}
		});
	}

	valueCompare(column1, column2) {
		return column1 && column2 ? column1.colId == column2.colId : column1 == column2;
	}

	selectColumns() {
		this.selectedColumns = this.columns.filter((menuitem) => menuitem.show).map((menuitem) => menuitem.colId);
		const state: any = [];
		for (const column of this.columns) {
			let found = false;
			for (const selectedColumn of this.selectedColumns) {
				if (column.colId === selectedColumn) {
					found = true;
					break;
				}
			}
			column.show = found;
			state.push({ colId: column.colId, hide: !column.show });
		}
		const saveState = JSON.stringify({ state: state });
		this.gridColumnApi.applyColumnState({ state: state });
		if (this.columnStorage) {
			sessionStorage.setItem(this.columnStorage, saveState);
		}
	}

	applyColumns() {
		const state: any = [];
		this.selectedColumns;
		this.columns;
		for (const column of this.columns) {
			if (!this.useDialog) {
				let found = false;

				for (const selectedColumn of this.selectedColumns) {
					if (column.colId === selectedColumn.colId) {
						found = true;
						break;
					}
				}

				column.show = found;
			}

			state.push({ colId: column.colId, hide: !column.show });
		}
		const saveState = JSON.stringify({ state: state });
		this.gridColumnApi.applyColumnState({ state: state });
		if (this.columnStorage) {
			sessionStorage.setItem(this.columnStorage, saveState);
		}
		// set placeholders on the grid floating filter fields
		Array.from(document.querySelectorAll('.ag-floating-filter-body .ag-input-field-input')).forEach((obj: any) => {
			if (obj.attributes['disabled']) {
				// skip columns with disabled filter
				return;
			}

			const label = obj.getAttribute('aria-label');
			const value = label.substring(0, label.indexOf('Filter Input')) + '...';
			obj.setAttribute('placeholder', value);
		});
	}
}
