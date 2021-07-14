import { DialogFactoryService } from 'src/app/dialog/services/dialog-factory.service';
import { NotificationService } from 'src/app/services/notification.service';
import { RefsetService } from 'src/app/services/rest/refset.service';
import { RefsetDownloadComponent } from './refset-download.component';

fdescribe('RefsetDownloadComponent', () => {
    let mockRefset: RefsetDownloadComponent;
    let mockDialogFactoryService: DialogFactoryService;
    let mockRefsetService: RefsetService;
    let mockNotificationService: NotificationService;

    mockDialogFactoryService = {} as DialogFactoryService;
    mockRefsetService = {} as RefsetService;
    mockNotificationService = {} as NotificationService;

    mockRefset = new RefsetDownloadComponent(mockDialogFactoryService, mockRefsetService, mockNotificationService);

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

    describe('shouldShowDeltaContentLabel', () => {
        it('should return false if comparisonToOptions and comparisonFromOptions have exactly one version', () => {
            mockRefset.comparisonToOptions = ['01/21/1968'];
            mockRefset.comparisonFromOptions = ['01/21/1968'];

            expect(mockRefset.shouldShowDeltaContentLabel()).toBe(false);
        });
        it('should return true if comparisonToOptions and comparisonFromOptions have more than one version and the comparisonToOptions dates are GREATER than the current version', () => {
            mockRefset.comparisonToOptions = [{'value': '1968-02-21', 'display': '1968-02-21(In Development)'}, {'value': '1968-02-21', 'display': '1968-02-21(In Development)'}];
            mockRefset.comparisonFromOptions = [{'value': '1969-02-21', 'display': '1969-02-21(In Development)'}, {'value': '1968-02-21', 'display': '1968-02-21(In Development)'}];
            mockRefset.selectedVersionDate = '1970-02-21';

            expect(mockRefset.shouldShowDeltaContentLabel()).toBe(true);
        });
        it('should return false if comparisonToOptions and comparisonFromOptions have more than one version and the comparisonToOptions dates are GREATER than the current version', () => {
            mockRefset.comparisonToOptions = [{'value': '1968-02-21', 'display': '1968-02-21(In Development)'}, {'value': '1968-02-21', 'display': '1968-02-21(In Development)'}];
            mockRefset.comparisonFromOptions = [{'value': '1969-02-21', 'display': '1969-02-21(In Development)'}, {'value': '1968-02-21', 'display': '1968-02-21(In Development)'}];
            mockRefset.selectedVersionDate = '1965-02-21';

            expect(mockRefset.shouldShowDeltaContentLabel()).toBe(false);
        });
    });
});
