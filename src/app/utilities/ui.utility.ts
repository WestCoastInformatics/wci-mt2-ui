import { CodeUtility } from './code.utility';
import { NotificationService } from 'src/app/services/notification.service';
import { environment } from 'src/environments/environment';
import { RefsetService } from 'src/app/services/rest/refset.service';
import { Router } from '@angular/router';
import { IToastButton } from 'src/app/components/notification/notification.component';
import { ActiveToast } from 'ngx-toastr';
import { Constants } from './constants.utility';

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
	 * gridDateValueGetter - return a formated date for a json unix style field value for an AG-Grid. Requires the colDef has the field defined. Can also specify valueFormat on the colDef
	 * @param [object] params - The ag-grid valuegetter params object.
	 */
	static gridDateValueGetter(params) {
		if (params?.data && CodeUtility.hasValue(params.data[params.colDef.field])) {
			let format = CodeUtility.DATE_FORMAT_REVERSE;

			if (params.colDef.valueFormat) {
				format = params.colDef.valueFormat;
			}
			return CodeUtility.formatJsonDate(params.data[params.colDef.field], format);
		} else {
			return '';
		}
	}

	static dateFormatter(params) {
		const format = CodeUtility.DATE_FORMAT_REVERSE;
		return CodeUtility.formatJsonDate(params, format);
	}

	/*
	 * getByElementOrSelector - return a element object having been passed either a element object or element selector string
	 * @param [object or string] elementOrSelector - Either a element object or the class or id selector (including the "#" or "." prefix).
	 * @return - the element object
	 */
	static getByElementOrSelector(formElementOrSelector) {
		let element;

		// If the type of the first parameter is a string, then use it as a jquery selector, otherwise use as is
		if (typeof formElementOrSelector === 'string') {
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
		const focusableElements = 'a:not([disabled]), button:not([disabled]), input:not([disabled]), select:not([disabled]), [tabindex]:not([disabled]):not([tabindex="-1"])';
		const activeElement: any = document.activeElement;

		if (activeElement && activeElement.form) {
			const focusable = Array.prototype.filter.call(activeElement.form.querySelectorAll(focusableElements), function (element) {
				//check for visibility while always include the current activeElement
				return element.offsetWidth > 0 || element.offsetHeight > 0 || element === document.activeElement;
			});

			const index = focusable.indexOf(document.activeElement);
			focusable[index + 1].focus();
		}
	}

	// function to switch a field between enabled and disabled
	static toggleFieldAvailability(elementOrSelector, enable) {
		const element = this.getByElementOrSelector(elementOrSelector);

		if (enable == undefined || enable == null) {
			if (element.hasClass('ui-state-disabled')) {
				enable = true;
			} else {
				enable = false;
			}
		}

		if (enable) {
			element.removeClass('ui-state-disabled');
			element.prop('disabled', false);
		} else {
			element.addClass('ui-state-disabled');
			element.prop('disabled', true);
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

		const notifyOfError = () => {
			if (CodeUtility.hasValue(downloadUrl)) {
				window.URL.revokeObjectURL(downloadUrl);
			}

			if (notificationService.isOpen(downloadNotification)) {
				notificationService.close(downloadNotification);
			}

			downloadNotification = notificationService.show('Your ' + description + ' has encountered an error. Please try again', null, 'error', {
				closeButton: true,
				timeOut: 0,
				extendedTimeOut: 0,
			});
			downloadNotification;
		};

		$.ajax({
			type: 'GET',
			url: url,
			xhrFields: {
				responseType: 'blob', // to avoid binary data being mangled on charset conversion
			},
			xhr: function () {
				const request = $.ajaxSettings.xhr();

				request.addEventListener('readystatechange', function (event) {
					try {
						if (request.status != 500 && request.readyState == 4) {
							// Downloaing has finished
							downloadUrl = URL.createObjectURL(request.response);
							const id = 'file_download_' + CodeUtility.getUniqueID();

							if (!CodeUtility.hasValue(fileName)) {
								const disposition = request.getResponseHeader('Content-Disposition');

								if (disposition && disposition.indexOf('attachment') !== -1) {
									/* eslint-disable no-useless-escape */
									const regex = /filename[^;=\n]*=((['"]).*?\2|[^;\n]*)/;
									const matches = regex.exec(disposition);

									if (matches != null && matches[1]) {
										fileName = matches[1].replace(/['"]/g, '');
									} else {
										fileName = '';
									}
								}
							}

							const sanatizedDownloadUrl = notificationService.sanitizeUrl(downloadUrl);

							const message = 'Your ' + description + ' is complete. Click this message to download your file';

							notificationService.update(downloadNotification, message, null, null, { url: sanatizedDownloadUrl, download: fileName, urlId: id }, 100);

							setTimeout(function () {
								$('#' + id).click(function () {
									notificationService.close(downloadNotification);
								});
							}, 600);

							// Recommended : Revoke the object URL after some time to free up resources. There is no way to find out whether user finished downloading
							setTimeout(function () {
								window.URL.revokeObjectURL(downloadUrl);

								if (notificationService.isOpen(downloadNotification)) {
									notificationService.close(downloadNotification);
									notificationService.show('Your ' + description + ' expired after 5 minutes. Please try again', null, 'error', {
										closeButton: true,
										timeOut: 0,
										extendedTimeOut: 0,
									});
								}
							}, 300000);
						}
					} catch (error) {
						notifyOfError();
					}
				});

				request.addEventListener('progress', function (event) {
					const percent_complete = (event.loaded / event.total) * 100;

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
			},
		});
	}

	// Function to open SNOMED ECL Builder
	static openEclBuilder(fieldId, branch) {
		const field = $('#' + fieldId);
		let eclString: any = field.val();
		const snowstormApiUrl = environment['restContextPath'] + 'snowstorm';
		const regex = /^([\ a-zA-Z0-9\ \<\>\!\^]*(\|[^\|]*\|)?)*$/gm;

		if (!regex.test(eclString)) {
			eclString = '';
		}

		$('body').append('<ecl-builder id="ecl-builder" branch=' + branch + ' api-url="' + snowstormApiUrl + '" ecl-string="' + eclString + '"></ecl-builder>');

		const eclBuilder = document.querySelector('ecl-builder');
		//eclBuilder.querySelector('input').focus();

		eclBuilder.addEventListener('output', (event: any) => {
			field.val(event.detail);

			// need to create a custom event to allow jquery to trigger an Angular event
			const customEvent = document.createEvent('Event');
			customEvent.initEvent('input', true, true);
			field[0].dispatchEvent(customEvent);
		});
	}

	// Function for background processesing of lengthy add/remove member tasks, and notification to user of the status of those tasks
	static manageMemberNotifications(
		refsetInternalId: string,
		refsetId: string,
		description: string,
		callbackFunction: Function,
		notificationService: NotificationService,
		refsetService: RefsetService,
		router: Router
	) {
		// set a small delay so the original call has some time to process
		CodeUtility.delay(500);

		let message = 'Members are being ' + description + ' Reference Set ' + refsetId + '.';
		let messagePrefix = '';

		if (description.includes(Constants.EXCLUSION) || description.includes(Constants.INCLUSION)) {
			if (description.includes(Constants.EXCLUSION)) {
				if (description.includes('added')) {
					description = 'removed from';
					message = 'An exclusion is being added and members are being removed from';
					messagePrefix = 'An exclusion was added. ';
				} else if (description.includes('removed')) {
					description = 'added to';
					message = 'An exclusion is being removed and members are being added to';
					messagePrefix = 'An exclusion was removed. ';
				} else {
					description = 'changed';
					message = 'members may be changed';
					messagePrefix = 'Members may have changed. ';
				}
			} else {
				if (description.includes('added')) {
					description = 'added to';
					message = 'An inclusion is being added and members are being added to';
					messagePrefix = 'An inclusion was added. ';
				} else {
					description = 'removed from';
					message = 'An inclusion is being removed and members are being removed from';
					messagePrefix = 'An inclusion was removed. ';
				}
			}

			message += ' Reference Set ' + refsetId + '.';
		}

		message +=
			' The Reference Set is locked until the operation completes. You can close this message and do other operations on the site, you will be notified when the Reference Set is ready if you do not refresh the page.';

		let notification = notificationService.show(message, null, 'info', { timeOut: 0, extendedTimeOut: 0 });

		const viewRefsetButton: IToastButton = { id: 'view', title: 'View Reference Set', data: {} };
		const downloadReportButton: IToastButton = { id: 'download', title: 'Download Report', data: {} };
		const buttons = [downloadReportButton];
		let callNumber = 0;
		let callDelay = 1000;
		let successMessageTimeout = 0;
		this.router = router;

		const checkIfFinished = () => {
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
						const title = 'Member Change Notification';
						const messageEnd = description + ' Reference Set ' + refsetId + '. You may continue editing the Reference Set.';
						let notificationType = 'success';
						const conceptIdArray = Object.keys(data);
						const conceptStatusArray: any[] = [];
						const emptydata = { refset: refsetId, statuses: [] };
						const previousNotifications = notificationService.getNotificationsForRefset(refsetId, title);

						if (!this.memberChangeData[refsetId] || previousNotifications.length == 0) {
							this.memberChangeData[refsetId] = emptydata;
						}

						notificationService.close(notification);

						for (const conceptId of conceptIdArray) {
							const conceptStatus: any = data[conceptId];
							this.memberChangeData[refsetId].statuses.push({ Concept: conceptId, Operation: conceptStatus.operation, Status: conceptStatus.status });
							conceptStatusArray.push({
								code: conceptId,
								added: conceptStatus.operation == 'Added',
								failed: conceptStatus.status == 'Failed' || conceptStatus.status == 'Already Member',
								operation: conceptStatus.operation,
								status: conceptStatus.status,
								name: conceptStatus.name,
								active: conceptStatus.active,
							});
						}

						if (router.url.includes('/details/' + refsetId)) {
							successMessageTimeout = 5000;
							callbackFunction(conceptStatusArray);
						} else {
							buttons.unshift(viewRefsetButton);
						}

						if (conceptIdArray.length > 0) {
							const dataString = JSON.stringify(this.memberChangeData[refsetId].statuses);
							const someFailed = dataString.includes('Failed');
							const someSucceeded = dataString.includes('Success');

							if (!someFailed && someSucceeded) {
								message = messagePrefix + 'All members were successfully ' + messageEnd;
							} else if (someFailed && !someSucceeded) {
								notificationType = 'error';
								message = messagePrefix + 'No members were able to be ' + messageEnd;
							} else {
								notificationType = 'warning';
								message = messagePrefix + 'Some members were not able to be ' + messageEnd;
							}
						} else if (description.includes('changed')) {
							const noContentMessage = 'There were no concepts changed for Reference Set ' + refsetId + '. You may continue editing the Reference Set.';

							notificationType = 'success';

							if (previousNotifications.length > 0) {
								if (notificationService.isNotificationOfType(previousNotifications[0], 'error')) {
									notificationType = 'error';
								}

								if (previousNotifications[0].message == noContentMessage) {
									message = previousNotifications[0].message;
								} else {
									message = 'There were no concepts changed in the last request for Reference Set ' + refsetId + '. Previous requests had: ' + previousNotifications[0].message;
								}
							} else {
								message = noContentMessage;
								buttons.pop();
							}
						} else {
							const noContentMessage = 'There were no concepts in the request for Reference Set ' + refsetId + '.';
							const noSpecialCharatersMessage = ' Make sure you do not have special characters included (ie: % $ # etc.).';
							const continueEditingMessage = ' You may continue editing the Reference Set.';
							notificationType = 'warning';

							if (previousNotifications.length > 0) {
								if (notificationService.isNotificationOfType(previousNotifications[0], 'error')) {
									notificationType = 'error';
								}

								if (previousNotifications[0].message == noContentMessage + noSpecialCharatersMessage + continueEditingMessage) {
									message = previousNotifications[0].message;
								} else {
									message =
										'There were no concepts in the last request for Reference Set ' +
										refsetId +
										'.' +
										noSpecialCharatersMessage +
										' Previous requests had: ' +
										previousNotifications[0].message;
								}
							} else {
								message = noContentMessage + noSpecialCharatersMessage + continueEditingMessage;
								buttons.pop();
							}
						}

						if (previousNotifications.length > 0) {
							notificationService.close(previousNotifications[0]);
						}

						notification = notificationService.show(message, title, notificationType, { timeOut: 0, extendedTimeOut: 0 }, refsetId, buttons);

						notification.onAction.subscribe((button) => {
							if (button.id == 'download') {
								let changeType = 'add';

								if (description.includes('remove')) {
									changeType = 'remove';
								}

								this.createMemberChangeReport(refsetId, notification, notificationService, changeType);
							} else if (button.id == 'view') {
								this.viewRefset(refsetId, Constants.IN_DEVELOPMENT);
							}
						});
					}
				},
				(error) => {
					console.log(error);
					message = 'There has been a problem  ' + description + ' Reference Set ' + refsetId + '. View the Reference Set to determine changes or contact an administrator.';
					notificationService.show(message, null, 'error', { timeOut: 0, extendedTimeOut: 0 });
				}
			);
		};

		checkIfFinished();
	}

	// Function for background processesing of lengthy non member Reference Set tasks, and notification to user of the status of those tasks
	static manageProcessNotifications(
		refsetInternalId: string,
		refsetId: string,
		versionDate: string,
		callbackFunction: Function,
		notificationService: NotificationService,
		refsetService: RefsetService,
		router: Router,
		processType: string
	) {
		// set a small delay so the original call has some time to process
		CodeUtility.delay();

		let title = 'Reference Set Upgrade Analysis Launch Notification';
		let message =
			'Reference Set ' +
			refsetId +
			' has started the ' +
			processType +
			' process. The Reference Set is locked until the operation completes. You can close this message and do other operations on the site, ';
		const viewRefsetButton: IToastButton = { id: 'view', title: 'View Reference Set', data: {} };
		let buttons = [viewRefsetButton];

		if (processType == 'upgrade') {
			message += 'you will be notified when the Reference Set is ready if you do not refresh the page.';

			//const downloadInactiveReportButton: IToastButton = {id: 'inactiveChangeReport', title: 'Download Inactive Change Report', data: {}};
			//const downloadChangeReportButton: IToastButton = {id: 'finishedChangeReport', title: 'Download Finished Change Report', data: {}};
			// buttons.push(downloadInactiveReportButton);
		} else if (processType == 'comparison') {
			title = 'Reference Set Comparison Launch Notification';
			message += 'but do not refresh the page or you will need to repeat the process.';
			const showComparisonButton: IToastButton = { id: 'comparison', title: 'Show Comparison', data: {} };
			buttons.push(showComparisonButton);
		} else if (processType == 'bulk upgrade') {
			buttons = [];
			message =
				'The following Reference Sets have started the ' +
				processType +
				' process. The Reference Sets are locked until the operation completes. ' +
				'You can close this message and do other operations on the site, you will be notified when the Reference Sets are ready if you do not refresh the page. <br>' +
				refsetId;
		}

		let notification = notificationService.show(message, null, 'info', { timeOut: 0, extendedTimeOut: 0 });

		let callNumber = 0;
		let callDelay = 1000;
		const successMessageTimeout = 0;
		this.router = router;

		const checkIfFinished = () => {
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
						const notificationType = 'success';
						const previousNotifications = notificationService.getNotificationsForRefset(refsetId, title);

						notificationService.close(notification);

						if (router.url.includes('/' + refsetId)) {
							buttons.shift();
						}

						if (processType != 'bulk upgrade') {
							// Not sure about the processType thats why commented out the last one
							// message = 'Reference Set ' + refsetId + ' has successfully completed the ' + processType + ' process. It is no longer locked.';
							message = `Reference Set ${refsetId} ${processType} analysis successfully completed. The reference set is now ready to continue the ${processType} process.`;
						} else {
							message = 'The following Reference Sets have successfully completed the ' + processType + ' process. They are no longer locked. <br>' + refsetId;
						}

						if (previousNotifications.length > 0) {
							notificationService.close(previousNotifications[0]);
						}

						notification = notificationService.show(message, title, notificationType, { timeOut: 0, extendedTimeOut: 0 }, refsetId, buttons);

						notification.onAction.subscribe((button) => {
							if (button.id == 'view') {
								this.viewRefset(refsetId, versionDate);
							} else if (button.id == 'inactiveChangeReport') {
								this.createInactiveChangeReport(refsetId, JSON.parse(sessionStorage.getItem('inactiveChangeReportData')));
							} else if (button.id == 'comparison') {
								callbackFunction();
								notificationService.close(notification);
							} else if (button.id == 'finishedChangeReport') {
								this.createFinishedChangeReport(refsetId, JSON.parse(sessionStorage.getItem('finishedChangeReportData')));
							}
						});

						if (processType.includes('upgrade')) {
							callbackFunction();
						}
					}
				},
				(error) => {
					console.log(error);
					message = 'There has been a problem with Reference Set ' + refsetId + ' during the ' + processType + ' process. Please contact an administrator.';
					notificationService.show(message, null, 'error', { timeOut: 0, extendedTimeOut: 0 });
				}
			);
		};

		checkIfFinished();
	}

	static createMemberChangeReport(refsetId: string, notification: ActiveToast<any>, notificationService: NotificationService, changeType): void {
		const memberStatuses = this.memberChangeData[refsetId].statuses;
		const fileName = 'Refset_' + this.memberChangeData[refsetId].refset + '_Member_Change_Report_' + CodeUtility.getReverseDate();

		for (const memberStatus of memberStatuses) {
			if (memberStatus.Status.includes('Failed')) {
				if (changeType == 'add') {
					memberStatus.Status = 'Invalid ID';
				} else {
					memberStatus.Status = 'Unable to remove ID';
				}
			}
		}

		this.downloadFile(memberStatuses, ['Concept', 'Operation', 'Status'], fileName, false, false, false);
		notificationService.close(notification);
		delete this.memberChangeData[refsetId];
	}

	static createInactiveChangeReport(refsetId: string, data): void {
		const fileName = 'Refset_' + refsetId + '__Inactive_Change_Report_' + CodeUtility.getReverseDate();

		this.downloadFile(
			data,
			['Inactivation Reason', 'Inactive ID', 'Inactive Concept', 'Suggested Replacement Association', 'Suggested Replacement ID', 'Suggested Replacement Concept'],
			fileName,
			false,
			false,
			false
		);
	}

	static createFinishedChangeReport(refsetId: string, data): void {
		const fileName = 'Refset_' + refsetId + '__Change_Report_' + CodeUtility.getReverseDate();

		const headerObject = {
			'newMemberTitle': ['New Members'],
			'newMemberHeader': ['id', 'effectiveTime', 'active', 'moduleId', 'refsetId', 'referencedComponentId'],
			'oldMemberTitle': ['Old Members'],
			'oldMemberHeader': ['id', 'effectiveTime', 'active', 'moduleId', 'refsetId', 'referencedComponentId'],
			'totalInactiveConceptsTitle': ['Inactive Concepts with their suggested Replacement Concepts'],
			'totalInactiveConceptsHeader': [
				'Inactive Concept ID',
				'Inactive Concept Name',
				'Reason',
				'Suggested Replacement Association',
				'Suggested Replacement ConceptID(s)',
				'Suggested Replacement Name',
			],
			'membersInCommonTitle': ['Members in Common'],
			'membersInCommonHeader': ['id', 'effectiveTime', 'active', 'moduleId', 'refsetId', 'referencedComponentId'],
		};

		this.downloadFile(data, headerObject, fileName, true, true, false);
	}

	static createAuditReport(refsetId: string, data): void {
		const fileName = 'Refset_' + refsetId + '__Audit_Report_' + CodeUtility.getReverseDate();

		const headerObject = {
			'auditHeader': ['Date', 'Modified By', 'Message', 'Details'],
		};

		this.downloadFile(data, headerObject, fileName, true, false, true);
	}

	static downloadFile(data, headerlist, fileName = 'download' + '_' + CodeUtility.getReverseDate(), merge = false, isFinishedChangeReport = false, isAuditReport = false) {
		let csvData;

		if (!merge) {
			csvData = this.convertToCsv(data, headerlist);
		} else if (isFinishedChangeReport) {
			csvData =
				this.convertToCsv([], headerlist.newMemberTitle) +
				this.convertToCsv(data.newMember, headerlist.newMemberHeader) +
				'\r\n\r\n\r\n' +
				this.convertToCsv([], headerlist.oldMemberTitle) +
				this.convertToCsv(data.oldMember, headerlist.oldMemberHeader) +
				'\r\n\r\n\r\n' +
				this.convertToCsv([], headerlist.totalInactiveConceptsTitle) +
				this.convertToCsv(data.totalInactiveConcepts, headerlist.totalInactiveConceptsHeader) +
				'\r\n\r\n\r\n' +
				this.convertToCsv([], headerlist.membersInCommonTitle) +
				this.convertToCsv(data.membersInCommon, headerlist.membersInCommonHeader);
		} else if (isAuditReport) {
			csvData = this.convertToCsv(data.auditData, headerlist.auditHeader);
		} else {
			csvData =
				this.convertToCsv(data.oldMember, headerlist.oldMemberHeader) +
				'\r\n\r\n\r\n' +
				this.convertToCsv(data.newMember, headerlist.newMemberHeader) +
				'\r\n\r\n\r\n' +
				this.convertToCsv(data.manualReplacement, headerlist.manualReplacementHeader) +
				'\r\n\r\n\r\n' +
				this.convertToCsv(data.membersInCommon, headerlist.membersInCommonHeader);
		}

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

		for (let i = 0; i < array?.length; i++) {
			let line = i + 1 + '';

			for (const index in headerList) {
				const head = headerList[index];
				line += ',' + array[i][head]?.replaceAll(',', ';');
			}

			csvString += line + '\r\n';
		}

		return csvString;
	}

	static viewRefset(refsetId, versionDate) {
		if (!versionDate) {
			versionDate = Constants.IN_DEVELOPMENT;
		}
		this.router.navigate(['/details', refsetId, versionDate], { replaceUrl: false, skipLocationChange: false });
	}

	static toggleLockedSections(lock: boolean) {
		const containingDiv = $('.rt2-lockable');

		if (lock) {
			containingDiv.addClass('rt2-disable-section');
		} else {
			containingDiv.removeClass('rt2-disable-section');
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

	static prepareIconImage(image: any, iconUri: string, iconType = 'user') {
		let genericIconFunction = this.getGenericUserIcon;
		let labelTag = 'User Icon';

		if (iconType == 'organization') {
			genericIconFunction = this.getGenericOrganizationIcon;
			labelTag = 'Organization Icon';
		}

		image.alt = labelTag;
		image.ariaLabel = labelTag;

		if (CodeUtility.hasValue(iconUri)) {
			image.scr = this.getIconImageUrl(iconUri);

			image.onerror = ($event) => {
				$event.target.src = genericIconFunction();
			};
		} else {
			image.scr = genericIconFunction();
		}

		return image.scr;
	}

	static getIconImageUrl(iconUri) {
		return environment.restUrl + environment.restContextPath + iconUri;
	}

	static getGenericUserIcon() {
		return '/assets/user_logo.png';
	}

	static getGenericOrganizationIcon() {
		return '/assets/user_logo.png';
	}

	//***** AG Grid Function to set placeholders on the grid floating filter fields *****/
	static applyGridPlaceholders(classSelector) {
		Array.from(document.querySelectorAll(classSelector)).forEach((field: any) => {
			// skip columns with disabled filter
			if (field.attributes['disabled']) {
				return;
			}

			const label = field.getAttribute('aria-label');
			const value = label.substring(0, label.indexOf('Filter Input')) + '...';
			field.setAttribute('placeholder', value);
		});
	}

	//***** AG Grid Function to apply data and paging to table *****/
	static applyServerPagedGridResults(results, gridApi, pagingParams, pageNumber, rowParams, serverPaging = true) {
		results.items = results;
		results.totalKnown = results.length;
		results.total = results.length;
		if (results.items.length > 0) {
			gridApi.hideOverlay();
			let lastRow = -1;

			if (results.totalKnown || results.items.length < gridApi.paginationGetPageSize() || pagingParams.totalKnown) {
				if (results.totalKnown) {
					lastRow = results.total;
				} else if (pagingParams.totalKnown) {
					lastRow = pagingParams.totalRows;
				} else {
					lastRow = results.items.length + (pageNumber - 1) * gridApi.paginationGetPageSize();
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

		pagingParams.manualStateRefresh = true;
	}

	//***** AG Grid Filter query string formatter Function *****/
	// filterModel: {columnName1:{filterType: 'text', filter: 'filter text'}, columnName2:{filterType: 'text', filter: 'filter text'}}
	static formatFilterData(filterModel) {
		const filterPresent = filterModel && Object.keys(filterModel).length > 0;

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
	static formatSortData(sortModel, returnAsObject = true, numberOfSortsAllowed = 1) {
		const sort: any = {};

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
		const sortPresent = sortModel && sortModel.length > 0;

		if (!sortPresent) {
			return data;
		}

		const resultOfSort = data.slice();

		resultOfSort.sort(function (a, b) {
			for (let k = 0; k < sortModel.length; k++) {
				const sortColModel = sortModel[k];
				const valueA = a[sortColModel.colId];
				const valueB = b[sortColModel.colId];

				if (valueA == valueB) {
					continue;
				}

				const sortDirection = sortColModel.sort === 'asc' ? 1 : -1;

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
		const filterPresent = filterModel && Object.keys(filterModel).length > 0;

		if (!filterPresent) {
			return data;
		}

		const resultOfFilter = [];

		for (let i = 0; i < data.length; i++) {
			const item = data[i];
			let rowValid = true;

			// loop thru each column with a search term
			for (const column in filterModel) {
				// test each word in the term
				filterModel[column].filter
					.trim()
					.toLowerCase()
					.split(' ')
					.forEach((word) => {
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

	static toTitleCase(str) {
		return str?.replace(/\w\S*/g, function (txt) {
			return txt.charAt(0).toUpperCase() + txt.substr(1).toLowerCase();
		});
	}
}
