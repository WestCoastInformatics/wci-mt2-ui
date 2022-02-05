import { CodeUtility } from "./code.utility";
import { NotificationService } from 'src/app/services/notification.service';
import { environment } from "src/environments/environment";
import { RefsetService } from "src/app/services/rest/refset.service";
import { Router } from "@angular/router";
import { IToastButton } from "src/app/components/notification/notification.component";
import { ActiveToast } from "ngx-toastr";

export class UiUtility {

    static router: Router;
    static memberChangeData = {};

    /*
     * resizeGridColumns - return a element object having been passed either a element object or element selector string
     * @param [object] event - The ag-grid event object.
     */
    static resizeGridColumns(event) {

        // check to see if any parent of the grid is hidden, if so don't resize the columns because the grid will error
        if (event.api.gridCore.eGridDiv.offsetParent != null) {
            event.api.sizeColumnsToFit();
        }
    }

    /*
     * gridDateValueGetter - return a formated date for a json unix style field value for an AG-Grid. Requires the colDef has the field defined
     * @param [object] params - The ag-grid valuegetter params object.
     */
    static gridDateValueGetter(params) {

        if (params?.data && CodeUtility.hasValue(params.data[params.colDef.field])) {

                let format = CodeUtility.DATE_FORMAT_REVERSE

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
    static getByElementOrSelector(formElementOrSelector) {

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

        if (enable == undefined || enable == null) {

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

    // function to download a file through a REST request
    static startFileDownload(notificationService: NotificationService, url, fileName = null, description = null) {

        // This will hold the the file as a local object URL
        let downloadUrl;
        let downloadNotification: any = null;

        if (!CodeUtility.hasValue(description)) {
            description = 'download';
        }

        let notifyOfError = () => {

            if (CodeUtility.hasValue(downloadUrl)){
                window.URL.revokeObjectURL(downloadUrl);
            }

            if (notificationService.isOpen(downloadNotification)) {
                notificationService.close(downloadNotification);
            }

            downloadNotification = notificationService.show('Your ' + description + ' has encountered an error. Please try again', null, 'error', {closeButton: true, timeOut: 0, extendedTimeOut: 0 });
            downloadNotification;
        };

        $.ajax({
            type: "GET",
            url: url,
            xhrFields: {
                responseType: 'blob' // to avoid binary data being mangled on charset conversion
            },
            xhr: function () {

                let request = $.ajaxSettings.xhr();

                request.addEventListener('readystatechange', function (event) {

                    try {

                        if (request.status != 500 && request.readyState == 4) {

                            // Downloaing has finished
                            downloadUrl = URL.createObjectURL(request.response);
                            let id = 'file_download_' + CodeUtility.getUniqueID();

                            if (!CodeUtility.hasValue(fileName)) {

                                let disposition = request.getResponseHeader('Content-Disposition');

                                if (disposition && disposition.indexOf('attachment') !== -1) {

                                    let regex = /filename[^;=\n]*=((['"]).*?\2|[^;\n]*)/;
                                    let matches = regex.exec(disposition);

                                    if (matches != null && matches[1]) {
                                        fileName = matches[1].replace(/['"]/g, '');
                                    } else {
                                        fileName = '';
                                    }
                                }
                            }

                            let sanatizedDownloadUrl = notificationService.sanitizeUrl(downloadUrl);

                            let message = 'Your ' + description + ' is complete. Click this message to download your file';

                            notificationService.update(downloadNotification, message, null, null, { url: sanatizedDownloadUrl, download: fileName, urlId: id}, 100);

                            setTimeout(function () {

                                $('#' + id).click(function () {
                                    notificationService.close(downloadNotification);
                                });
                            }, 600);

                            // Recommended : Revoke the object URL after some time to free up resources. There is no way to find out whether user finished downloading
                            setTimeout(function () {

                                window.URL.revokeObjectURL(downloadUrl);

                                if (notificationService.isOpen(downloadNotification)){

                                    notificationService.close(downloadNotification);
                                    notificationService.show('Your ' + description + ' expired after 5 minutes. Please try again', null, 'error', {closeButton: true, timeOut: 0, extendedTimeOut: 0 });
                                }
                            }, 300000);
                        }

                    } catch (error) {
                        notifyOfError();
                    }
                });

                request.addEventListener('progress', function (event) {

                    var percent_complete = (event.loaded / event.total) * 100;

                    if (downloadNotification == null) {
                        downloadNotification = notificationService.showProgress('Your ' + description + ' file is now being saved.', '', null, null);
                    } else {
                        notificationService.update(downloadNotification, 'Your ' + description + ' file is now being saved.', null, null, null, percent_complete);
                    }
                });

                request.responseType = 'blob';
                return request;
            },
            success: function (data) {

                if (data.error) {
                    notifyOfError();
                }
            },
            error: function (data) {
                notifyOfError();
            }
        });
    }

    // Function to open SNOMED ECL Builder
    static openEclBuilder(fieldId, branch) {
        
        let field = $('#' + fieldId);
        let eclString: any = field.val();
        let snowstormApiUrl = environment['snowstormApiUrl'];
        const regex = /^([\ a-zA-Z0-9\ \<\>\!\^]*(\|[^\|]*\|)?)*$/gm;

        if (!regex.test(eclString)) {
            eclString = '';
        }

        $('body').append('<ecl-builder id="ecl-builder" branch=' + branch + ' api-url="' + snowstormApiUrl + '" ecl-string="' + eclString + '"></ecl-builder>');

        const eclBuilder = document.querySelector('ecl-builder');

        eclBuilder.addEventListener('output', (event: any) => {

            field.val(event.detail);

            // need to create a custom event to allow jquery to trigger an Angular event
            const customEvent = document.createEvent('Event');
            customEvent.initEvent('input', true, true);
            field[0].dispatchEvent(customEvent);
        });
    }

    // Function for background processesing of lengthy refset tasks, and notification to user of the status of those tasks
    static manageNotifications (refsetInternalId: string, refsetId: string, description: string, callbackFunction: Function, notificationService: NotificationService, refsetService: RefsetService, router: Router) {

		let message = 'Members are being ' + description + ' refset ' + refsetId + '. The refset is locked until the operation completes. '
				+ 'You can close this message and do other operations on the site, you will be notified when the refset is ready if you do not refresh the page.';
		let notification = notificationService.show(message, null, 'info', {timeOut: 0, extendedTimeOut: 0});

		let viewRefsetButton : IToastButton = {id: 'view', title: 'View Refset', data: {}};
		let downloadReportButton : IToastButton = {id: 'download', title: 'Download Report', data: {}};
        let buttons = [downloadReportButton];
		let callNumber = 0;
		let callDelay = 1000;
		let successMessageTimeout = 0;
        this.router = router;

		let checkIfFinished = () => {

			callNumber++;

			if (callNumber == 20) {
				callDelay = 4000;

			} else if (callNumber == 30) {
				callDelay = 15000;
			}
			refsetService.isRefsetLocked(refsetInternalId).subscribe(

				(data) => {

					if (CodeUtility.testBoolean(data)) {
						setTimeout(checkIfFinished, callDelay);
					} else {

                        let title = 'Member Change Notification';
                        let messageEnd = description + ' refset ' + refsetId + '. You may continue editing the refset.';
                        let notificationType = 'success';
						let conceptArray = Object.keys(data);
                        let emptydata = {refset: refsetId, statuses: []};
                        let previousNotifications = notificationService.getNotificationsForRefset(refsetId, title);

                        if (!this.memberChangeData[refsetId] || previousNotifications.length == 0) {
                            this.memberChangeData[refsetId] = emptydata;
                        }

						notificationService.close(notification);

						if (router.url.includes('/' + refsetInternalId)) {

							successMessageTimeout = 5000;
							callbackFunction(data);
						} else {
                            buttons.unshift(viewRefsetButton);
                        }

                        for (let conceptID of conceptArray) {

                            let conceptStatus: any = data[conceptID];
                            this.memberChangeData[refsetId].statuses.push({Concept: conceptID, Operation: conceptStatus.operation, Status: conceptStatus.status});
                        }

                        if (conceptArray.length > 0) {
                            
                            let dataString = JSON.stringify(this.memberChangeData[refsetId].statuses);
                            let someFailed = dataString.includes('Failed');
                            let someSucceeded = dataString.includes('Success');

                            if (!someFailed && someSucceeded) {
                                message = 'All members were successfully ' + messageEnd;

                            } else if (someFailed && !someSucceeded) {

                                notificationType = 'error';
                                message = 'No members were able to be ' + messageEnd;
                            } else {

                                notificationType = 'warning';
                                message = 'Some members were not able to be ' + messageEnd;
                            }
                        } else {

                            let noContentMessage = 'There were no concepts in the request for refset ' + refsetId + '.';
                            let noSpecialCharatersMessage = ' Make sure you do not have special characters included (ie: % $ # ect.).';
                            let continueEditingMessage = ' You may continue editing the refset.';
                            notificationType = 'warning';

                            if (previousNotifications.length > 0) {

                                if (notificationService.isNotificationOfType(previousNotifications[0], 'error')) {
                                    notificationType = 'error';
                                }

                                if (previousNotifications[0].message == noContentMessage + noSpecialCharatersMessage + continueEditingMessage) {
                                    message = previousNotifications[0].message;
                                } else {
                                    message = 'There were no concepts in the last request for refset ' + refsetId + '.' + noSpecialCharatersMessage + ' Previous requests had: ' + previousNotifications[0].message;
                                }

                            } else {

                                message = noContentMessage + noSpecialCharatersMessage + continueEditingMessage;
                                buttons.pop();
                            }
                        }

                        if (previousNotifications.length > 0) {
                            notificationService.close(previousNotifications[0]);
                        }

						notification = notificationService.show(message, title, notificationType, {timeOut: 0, extendedTimeOut: 0}, refsetId, buttons);
                        
                        notification.onAction.subscribe(button => {

                            if (button.id == 'download') {
                                this.createMemberChangeReport(refsetId, notification, notificationService);

                            } else if (button.id == 'view') {
                                this.viewRefset(refsetInternalId);
                            }
                        });

                        // notification.onHidden.subscribe(() => {
                        //     this.memberChangeData[refsetId] = emptydata;
                        // });
					}
				},
				(error) => {

					console.log(error);
                    message = 'There has been a problem  ' + description + ' refset ' + refsetId + '. View the refset to determine changes or contact an administrator.';
					notificationService.show(message, null, 'error', {timeOut: 0, extendedTimeOut: 0});
				}
			);
		};

		checkIfFinished();
	}

    static createMemberChangeReport(refsetId: string, notification: ActiveToast<any>, notificationService: NotificationService): void {

        let memberStatuses = this.memberChangeData[refsetId].statuses;
        let fileName = "Refset_" + this.memberChangeData[refsetId].refset + "_Member_Change_Report_" + new Date().toLocaleDateString();

        this.downloadFile(memberStatuses, ['Concept', 'Operation', 'Status'], fileName);
        notificationService.close(notification);
        delete this.memberChangeData[refsetId];
    }

    static downloadFile(data, headerlist, fileName = 'download' + '_' + new Date().toLocaleDateString()) {

        const csvData = this.convertToCsv(data, headerlist);
        const blob = new Blob(['\ufeff' + csvData], { type: 'text/csv;charset=utf-8;' });
        const downloadLink = document.createElement('a');
        const url = URL.createObjectURL(blob);
        const isSafariBrowser = navigator.userAgent.indexOf('Safari') != -1 && navigator.userAgent.indexOf('Chrome') == -1;
        
        if (isSafariBrowser) {
            downloadLink.setAttribute('target', '_blank');
        }

        downloadLink.setAttribute('href', url);
        downloadLink.setAttribute('download', fileName + '.csv');
        downloadLink.style.visibility = 'hidden';

        document.body.appendChild(downloadLink);
        downloadLink.click();
        document.body.removeChild(downloadLink);
    }
    
    static convertToCsv(objectArray, headerList) {

         const array = typeof objectArray != 'object' ? JSON.parse(objectArray) : objectArray;
         let csvString = '';
         let row = '#,';
    
         for (const index in headerList) {
             row += headerList[index] + ',';
         }

         row = row.slice(0, -1);
         csvString += row + '\r\n';

         for (let i = 0; i < array.length; i++) {

             let line = (i + 1) + '';

             for (const index in headerList) {

                const head = headerList[index];
                 line += ',' + array[i][head];
             }

             csvString += line + '\r\n';
         }

         return csvString;
     }

    static viewRefset (refsetInternalId) {
        this.router.navigateByUrl('details/' + refsetInternalId);
	}

    static toggleLockedSections(lock: boolean) {

        let containingDiv = $('.refset-tool-lockable');

        if (lock) {
            containingDiv.addClass('refset-tool-disable-section');
        } else {
            containingDiv.removeClass('refset-tool-disable-section');
        }

        containingDiv.find('input, select, button').each(function () {
            $(this).prop('disabled', lock);
        });
    }

    static getRoleString(roles = []): string {

        const rolesToShow = [];

        for (const role of roles) {

            if (role == 'VIEWER') {
                continue;
            }

            rolesToShow.push(role);
        }

        rolesToShow.sort();
        
        return rolesToShow.join(', ');
    }

    //***** AG Grid Function to apply data and paging to table *****/
    static applyServerPagedGridResults(results, gridApi, pagingParams, pageNumber, rowParams, serverPaging = true) {

        if (results.items.length > 0) {

            gridApi.hideOverlay();
            let lastRow = -1;

            if (results.totalKnown || results.items.length < gridApi.paginationGetPageSize() || pagingParams.totalKnown) {

                if (results.totalKnown) {

                    lastRow = results.total;

                } else if (pagingParams.totalKnown) {

                    lastRow = pagingParams.totalRows;
                } else {

                    lastRow = results.items.length + ((pageNumber - 1) * gridApi.paginationGetPageSize());
                }

                pagingParams.totalRows = lastRow;
                pagingParams.totalKnown = true;

            }

            if (serverPaging) {
                rowParams.successCallback(results.items, lastRow);
            } else {
                gridApi.setRowData(results.items);
            }
            
        } else {

            gridApi.showNoRowsOverlay();

            if (serverPaging) {
                rowParams.successCallback(results.items, 0);
            }
        }

        pagingParams.manualStateRefresh = new Boolean(true);
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
            filterString += column + ':' + filterModel[column].filter.trim() + ' AND ';
        }

        filterString = CodeUtility.removeFinal(filterString, ' AND ');
        return filterString;
    }

    // ***** AG Grid Radio button search selector query string formatter Function *****/
    static formatSelectedData(columnDefs: any[], searchInput: string): string {

        const selectedDataPresent = columnDefs && columnDefs?.length;

        if (!selectedDataPresent) {
            return '';
        }

        let selectedDataString = '';
        // loop thru each column with a search term
        for (const column of columnDefs) {
            selectedDataString += column.field + ':' + searchInput?.trim() + ' OR ';
        }
        selectedDataString = CodeUtility.removeFinal(selectedDataString, ' OR ');

        return selectedDataString;
    }

    //***** AG Grid Sort query string formatter Function *****/
    // sortModel: [{sort: 'asc', colId: columnName1}, {sort: 'asc', colId: columnName1}]
    static formatSortData(sortModel, returnAsObject: boolean = true, numberOfSortsAllowed: number = 1) {

        let sort: any = {};

        // loop thru each column with a search term
        for (let i = 0; i < sortModel?.length && i < numberOfSortsAllowed; i++) {

            const column = sortModel[i];
            let ascending = true;

            if (column.sort != 'asc') {
                ascending = false;
            }

            sort.sort = column.colId;
            sort.sortAscending = ascending;
        }

        if (returnAsObject) {
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