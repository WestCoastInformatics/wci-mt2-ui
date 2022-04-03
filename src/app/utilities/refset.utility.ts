import { Refset } from "../models/refset";
import { CodeUtility } from "./code.utility";
import { UiUtility } from "./ui.utility";

export class RefsetUtility {

    static mockedVersionOptions = [{ value: '2021-02-21', display: 'In Development' }, { value: '2021-01-15', display: 'Published (2021-01-15)' }, { value: '2020-11-23', display: 'Beta (2020-11-23)' }];
    static SNOMED_ROOT_CONCEPT_ID = '138875005';
    static DEFAULT_LANGUAGE_CODE = 'en';
    static DEFAULT_LANGUAGE_REFSET = '900000000000509007';
    static DEFAULT_LANGUAGE_TYPE = 'PT';
    static DEFAULT_ACCEPT_LANGUAGE = RefsetUtility.DEFAULT_LANGUAGE_CODE + '-X-' + RefsetUtility.DEFAULT_LANGUAGE_REFSET;
    static INTENSIONAL = 'INTENSIONAL';
    static EXTENSIONAL = 'EXTENSIONAL';
    static EXTERNAL = 'EXTERNAL';
    static INCLUSION = 'INCLUSION';
    static EXCLUSION = 'EXCLUSION';
    static IN_DEVELOPMENT = 'IN DEVELOPMENT';
    static PUBLISHED = 'PUBLISHED';

    static getVersionOptions(refset, valueField: string = "id") {

        let versionOptions = [];

        for (let version of refset.versionList) {

            let value = version.refsetInternalId;

            if (valueField == "date") {

                if (version.status != RefsetUtility.IN_DEVELOPMENT) {
                    value = version.date;
                } else {
                    value = RefsetUtility.IN_DEVELOPMENT;
                }
            }

            let displayStatus = 'Published';

            if (version.status == RefsetUtility.IN_DEVELOPMENT) {
                displayStatus = 'In Development'
            }

            let option: any = { value: value, display: version.date + ' (' + displayStatus + ')', date: version.date, status: displayStatus };
        
            if (version.date === this.getVersionDate(refset) || (refset.versionStatus == this.IN_DEVELOPMENT && CodeUtility.getCurrentDate() === this.getVersionDate(refset))) {
                option.selected = true;
            }

            versionOptions.push(option);
        }

        if (versionOptions.length == 0){
            versionOptions = CodeUtility.clone(this.mockedVersionOptions);
        }

        return versionOptions;
    }

    static getVersionDate(refset): string {

        let date = '';

        if (refset.versionStatus == this.IN_DEVELOPMENT){
            date = CodeUtility.getCurrentDate();
        } else {
            date= refset.versionDate;
        }

        return date;
    }

    static getVersionDateForRefsetApiCall(refset): string {

        let date = '';

        if (refset.versionStatus == this.IN_DEVELOPMENT){
            date = this.IN_DEVELOPMENT;
        } else {
            date = CodeUtility.formatJsonDate(refset.versionDate, CodeUtility.DATE_FORMAT_REVERSE);
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

        if (!CodeUtility.testBoolean(active)){
            status = 'Inactive';
        }

        return status;
    }

    static getDefinedImage(defined) {

        let image = '/assets/linedTaxonomyIcon.png';

        if (!CodeUtility.testBoolean(defined)){
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

    static setEmptyChildrenNull(conceptList){

        for (let concept of conceptList){
            
            if (concept.children != null && concept.children.length == 0){
                concept.children = null;
            }
        }
    }

    static sortDescriptions(descriptions, fullyQualifiedLanguageRefsets){

        let languagePriority: any = {};
        let i = 1;

        // let the language priorities defined in the refset apply to the sort
        for (let languageRefset of fullyQualifiedLanguageRefsets){

            if (!languagePriority.hasOwnProperty(languageRefset.languageCode)){

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
            if (typeCompareValue != 0 ) {
                return typeCompareValue;
            }

            // finally sort alphabetically
            let descriptionCompareValue = description1.toString().localeCompare(description2);

            return descriptionCompareValue;
        });
    }
}