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
}