import { CodeUtility } from "./code.utility";
import { UiUtility } from "./ui.utility";
import { Constants } from "./constants.utility";

export class RefsetUtility {

    static mockedVersionOptions = [{ value: '2021-02-21', display: 'In Development' }, { value: '2021-01-15', display: 'Published (2021-01-15)' }, { value: '2020-11-23', display: 'Beta (2020-11-23)' }];

    // See constants.utility.ts for the things like INTENSIONAL, EXTENSIONAL, IN_DEVELOPMENT, etc.
    // They were moved to resolve a circular dependency

    static getVersionOptions(refset, valueField: string = "id") {

        let versionOptions = [];

        for (let version of refset.versionList) {

            let value = version.refsetInternalId;
            let versionDate = "";

            if (valueField == "date") {

                if (version.status != Constants.IN_DEVELOPMENT) {
                    value = version.date;
                } else {
                    value = Constants.IN_DEVELOPMENT;
                }
            }

            let displayStatus = 'Published';

            if (version.status == Constants.IN_DEVELOPMENT) {

                displayStatus = 'In Development';
                versionDate = Constants.IN_DEVELOPMENT;
            } else {
                versionDate = version.date;
            }

            let option: any = { value: value, display: version.date + ' (' + displayStatus + ')', date: version.date, versionDate: versionDate, status: displayStatus };

            if (version.date === this.getVersionDate(refset) || (refset.versionStatus == Constants.IN_DEVELOPMENT && CodeUtility.getCurrentDate() === this.getVersionDate(refset))) {
                option.selected = true;
            }

            versionOptions.push(option);
        }

        if (versionOptions.length == 0) {
            versionOptions = CodeUtility.clone(this.mockedVersionOptions);
        }

        return versionOptions;
    }

    static getVersionDate(refset): string {

        let date = '';

        if (refset.versionStatus == Constants.IN_DEVELOPMENT) {
            date = CodeUtility.getCurrentDate();
        } else {
            date = refset.versionDate;
        }

        return date;
    }

    static getVersionDateForRefsetApiCall(refset): string {

        let date = '';

        if (refset?.versionStatus == Constants.IN_DEVELOPMENT) {
            date = Constants.IN_DEVELOPMENT;
        } else {
            date = CodeUtility.formatJsonDate(refset?.versionDate, CodeUtility.DATE_FORMAT_REVERSE);
        }

        return date;
    }

    static getBranchPath(refset): string {

        let branchPath = refset.branchPath;

        if (refset.versionStatus == 'IN DEVELOPMENT') {
            branchPath = refset.edition.branch
        }

        return branchPath;
    }

    static getStatus(active) {

        let status = 'Active';

        if (!CodeUtility.testBoolean(active)) {
            status = 'Inactive';
        }

        return status;
    }

    static getDefinedImage(defined) {

        let image = '/assets/linedTaxonomyIcon.png';

        if (!CodeUtility.testBoolean(defined)) {
            image = '/assets/unlinedTaxonomyIcon.png';
        }

        return status;
    }

    static getEditionFlagIcon(branch: string) {

        let countryCode = branch.toLowerCase().substring(branch.toLowerCase().lastIndexOf('/snomedct-') + 10);
        let image = '';

        if (countryCode != '' && countryCode != branch.toLowerCase()) {
            if (countryCode.includes('upd')) {
                countryCode = countryCode.split('upd')[0];
            }
            image = '/assets/flags/' + countryCode + '.png';
        }

        return image;
    }

    static getLanguageRefsetFlagIcon(langRefsetId: string) {

        let image = '';
        image = '/assets/flags/' + langRefsetId + '.png';

        return image;
    }


    static setEmptyChildrenNull(conceptList) {

        for (let concept of conceptList) {

            if (concept.children != null && concept.children.length == 0) {
                concept.children = null;
            }
        }
    }

    static sortDescriptions(descriptions, fullyQualifiedLanguageRefsets) {

        let languagePriority: any = {};
        let i = 1;

        // let the language priorities defined in the refset apply to the sort
        for (let languageRefset of fullyQualifiedLanguageRefsets) {

            if (!languagePriority.hasOwnProperty(languageRefset.languageCode)) {

                languagePriority[languageRefset.languageCode] = i;
                i++;
            }
        }

        let typePriority = {
            'PT': 1,
            'AC': 2,
            'FSN': 3,
            'DEF': 4,
        };

        return descriptions.sort((description1, description2) => {

            let languageCompareValue = languagePriority[description1.language] - languagePriority[description2.language];

            // sort first based on language
            if (languageCompareValue != 0) {
                return languageCompareValue;
            }

            let typeCompareValue = typePriority[description1.type] - typePriority[description2.type];

            // sort second based on description type
            if (typeCompareValue != 0) {
                return typeCompareValue;
            }

            // finally sort alphabetically
            let descriptionCompareValue = description1.toString().localeCompare(description2);

            return descriptionCompareValue;
        });
    }

    static addRemoveMembersByList(refsetInternalId: string, refsetId: string, listOfIds: any, operation: string, callback: Function, notificationService: any, refsetService: any, router: any): void {

        if (!listOfIds?.length) {
            return;
        }

        let operationFunction: Function;
        let messageModifier = "";

        if (operation == 'add') {

            messageModifier = "added to";
            operationFunction = refsetService.addRefsetMembers.bind(refsetService);
        } else {

            messageModifier = "removed from";
            operationFunction = refsetService.removeRefsetMembers.bind(refsetService);
        }

        const commaRegex = /,+/ig;
        let allIdsString = listOfIds?.replaceAll(" ", ",").replaceAll("\n", ",").replaceAll(commaRegex, ",").replaceAll(/[^,\-\_a-zA-Z0-9]/g, '').trim();

        operationFunction(refsetInternalId, "list", allIdsString).subscribe();

        UiUtility.manageMemberNotifications(refsetInternalId, refsetId, messageModifier, callback, notificationService, refsetService, router);
    }
}
