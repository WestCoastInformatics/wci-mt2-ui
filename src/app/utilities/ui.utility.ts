import { CodeUtility } from "./code.utility";

export class UiUtility {


    /*
     * resizeGridColumns - return a element object having been passed either a element object or element selector string
     * @param [object] event - The ag-grid event object.
     */
    static resizeGridColumns(event) {

        // check to see if any parent of the grid is hidden, if so don't resize the columns because the grid will error
        if (event.api.gridCore.eGridDiv.offsetParent != null){
            event.api.sizeColumnsToFit();
        }
    }

    /*
     * gridDateValueGetter - return a formated date for a json unix style field value for an AG-Grid. Requires the colDef has the field defined  
     * @param [object] params - The ag-grid valuegetter params object.
     */
    static gridDateValueGetter(params) {

        if (params?.data && CodeUtility.hasValue(params.data[params.colDef.field])) {

            let format = null;

            if (params.colDef.field == 'versionDate'){
                format = CodeUtility.DATE_FORMAT_REVERSE
            }

            return CodeUtility.formatJsonDate(params.data[params.colDef.field], format);
        } else {
            return '';
        }
    }

    /*
     * getByElementOrSelector - return a element object having been passed either a element object or element selector string
     * @param [object or string] elementOrSelector - Either a element object or the class or id selector (including the "#" or "." prefix).
     * @return - the element object
     */
    static getByElementOrSelector(formElementOrSelector){ 

        let element;

        // If the type of the first parameter is a string, then use it as a jquery selector, otherwise use as is
        if (typeof formElementOrSelector === "string") {
            element = $(formElementOrSelector);
        } else {
            element = formElementOrSelector;
        }

        return element;
    }

    /*
     * focusNextFormElement - set focus on the next form element that isn't disabled
     */
    static focusNextFormElement() {

        //add all elements we want to include in our selection
        let focusableElements = 'a:not([disabled]), button:not([disabled]), input:not([disabled]), select:not([disabled]), [tabindex]:not([disabled]):not([tabindex="-1"])';
        let activeElement: any = document.activeElement;

        if (activeElement && activeElement.form) {

            var focusable = Array.prototype.filter.call(activeElement.form.querySelectorAll(focusableElements),
                function (element) {
                    //check for visibility while always include the current activeElement
                    return element.offsetWidth > 0 || element.offsetHeight > 0 || element === document.activeElement
                });

                let index = focusable.indexOf(document.activeElement);
            focusable[index + 1].focus();
        }
    }


    // function to switch a field between enabled and disabled
    static toggleFieldAvailability(elementOrSelector, enable) {

        let element = this.getByElementOrSelector(elementOrSelector);

        if (enable == undefined || enable == null){

            if (element.hasClass("ui-state-disabled")) {
                enable = true;
            } else {
                enable = false;
            }
        }

        if (enable) {

            element.removeClass("ui-state-disabled");
            element.prop("disabled", false);
        } else {

            element.addClass("ui-state-disabled");
            element.prop("disabled", true);
        }
    }

    //***** AG Grid Filter query string formatter Function *****/
    // filterModel: {columnName1:{filterType: 'text', filter: 'filter text'}, columnName2:{filterType: 'text', filter: 'filter text'}}
    static formatFilterData(filterModel) {

        let filterPresent = filterModel && Object.keys(filterModel).length > 0;

        if (!filterPresent) {
            return '';
        }

        let filterString = '';

        // loop thru each column with a search term
        for (const column in filterModel) {
            filterString += column + ':"' + filterModel[column].filter.trim() + '" AND ';
        }

        filterString = CodeUtility.removeFinal(filterString, ' AND ');

        return filterString;
    }

    //***** AG Grid Sort query string formatter Function *****/
    // sortModel: [{sort: 'asc', colId: columnName1}, {sort: 'asc', colId: columnName1}]
    static formatSortData(sortModel, returnAsObject: boolean = true, numberOfSortsAllowed: number = 1) {

        let sort: any = {};

        // loop thru each column with a search term
        for (let i = 0; i < sortModel?.length && i < numberOfSortsAllowed; i++) {

            const column = sortModel[i];
            let ascending = true;

            if (column.sort != 'asc'){
                ascending = false;
            }

            sort.sort = column.colId;
            sort.sortAscending = ascending;
        }

        if (returnAsObject){
            return sort;
        } else {
            return CodeUtility.serialize(sort);
        }
    }

    //***** AG Grid Sort Function *****/
    // sortModel: [{sort: 'asc', colId: columnName1}, {sort: 'asc', colId: columnName1}]
    static sortData(sortModel, data) {

        let sortPresent = sortModel && sortModel.length > 0;

        if (!sortPresent) {
            return data;
        }

        let resultOfSort = data.slice();

        resultOfSort.sort(function (a, b) {

            for (let k = 0; k < sortModel.length; k++) {

                let sortColModel = sortModel[k];
                let valueA = a[sortColModel.colId];
                let valueB = b[sortColModel.colId];

                if (valueA == valueB) {
                    continue;
                }

                let sortDirection = sortColModel.sort === 'asc' ? 1 : -1;

                if (valueA > valueB) {
                    return sortDirection;
                } else {
                    return sortDirection * -1;
                }
            }

            return 0;
        });

        return resultOfSort;
    }

    //***** AG Grid Filter Function *****/
    // filterModel: {columnName1:{filterType: 'text', filter: 'filter text'}, columnName2:{filterType: 'text', filter: 'filter text'}}
    static filterData(filterModel, data) {

        let filterPresent = filterModel && Object.keys(filterModel).length > 0;

        if (!filterPresent) {
            return data;
        }

        let resultOfFilter = [];

        for (let i = 0; i < data.length; i++) {

            let item = data[i];
            let rowValid = true;

            // loop thru each column with a search term
            for (const column in filterModel) {

                // test each word in the term
                filterModel[column].filter.trim().toLowerCase().split(' ').forEach(word => {

                    // the search word must be present in the data and the row must still be valid
                    if (item[column].toString().toLowerCase().indexOf(word) != -1 && rowValid) {
                        rowValid = true;
                    } else {
                        rowValid = false;
                    }
                });
            }

            if (rowValid) {
                resultOfFilter.push(item);
            }
        }

        return resultOfFilter;
    }
}