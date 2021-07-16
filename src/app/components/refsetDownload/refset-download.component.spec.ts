import { ChangeDetectorRef } from '@angular/core';
import { DialogFactoryService } from 'src/app/dialog/services/dialog-factory.service';
import { NotificationService } from 'src/app/services/notification.service';
import { RefsetService } from 'src/app/services/rest/refset.service';
import { RefsetDownloadComponent } from './refset-download.component';

describe('RefsetDownloadComponent', () => {
    let mockRefset: RefsetDownloadComponent;
    let mockDialogFactoryService: DialogFactoryService;
    let mockChangeDetectorRef: ChangeDetectorRef;
    let mockRefsetService: RefsetService;
    let mockNotificationService: NotificationService;

    mockDialogFactoryService = {} as DialogFactoryService;
    mockChangeDetectorRef = {} as ChangeDetectorRef;
    mockRefsetService = {} as RefsetService;
    mockNotificationService = {} as NotificationService;

    mockRefset = new RefsetDownloadComponent(mockDialogFactoryService, mockChangeDetectorRef, mockRefsetService, mockNotificationService);

    describe('addSpaceAfterVersionDate', () => {
        it('should add a space within a string preceding "("', () => {
            const stringWithParenthesis = '05/28/2019(something)';
            const stringWithoutParenthesis = '05/28/2019';

            expect(mockRefset.addSpaceAfterVersionDate(stringWithParenthesis)).toEqual('05/28/2019 (something)');
            expect(mockRefset.addSpaceAfterVersionDate(stringWithoutParenthesis)).toEqual('05/28/2019');
            expect(mockRefset.addSpaceAfterVersionDate(undefined)).toEqual(undefined);
            expect(mockRefset.addSpaceAfterVersionDate('')).toEqual('');
        });
    });
});
