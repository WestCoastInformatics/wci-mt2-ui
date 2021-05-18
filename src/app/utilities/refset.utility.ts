import { CodeUtility } from "./code.utility";

export class RefsetUtility {

    static mockedVersionOptions = [{ value: '2021-02-21', display: 'In Development' }, { value: '2021-01-15', display: 'Published (2021-01-15)' }, { value: '2020-11-23', display: 'Beta (2020-11-23)' }];

    static getVersionOptions(refset) {

        let versionOptions = [];

        for (let version of refset.versionList) {

            let option: any = { value: version.date, display: version.date + '(' + version.status + ')' };
            
            if (refset.versionStatus.toLowerCase() == 'in development'){
                option.value = CodeUtility.getCurrentDate();
            }

            if (version.date === this.getVersionDate(refset)) {
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

        if (refset.versionStatus.toLowerCase() == 'in development'){
            date = CodeUtility.getCurrentDate();
        } else {
            date= refset.versionDate;
        }

        return date;
    }

    static getBranchPath(refset): string {

        let date = '';
        let branchPath = "";
        let pathDate = "";

        if (refset.versionDate != null) {
            pathDate = "/" + refset.versionDate;
        }

        return branchPath = refset.edition.branch + pathDate;
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
}