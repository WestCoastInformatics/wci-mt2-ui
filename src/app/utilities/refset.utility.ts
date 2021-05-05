import { CodeUtility } from "./code.utility";

export class RefsetUtility {

    static mockedVersionOptions = [{ value: '2021-02-21', display: 'In Development' }, { value: '2021-01-15', display: 'Published (2021-01-15)' }, { value: '2020-11-23', display: 'Beta (2020-11-23)' }];

    static getVersionOptions(refset) {

        let versions = [refset.versionDate]; //refset.versionList
        let versionOptions = [];

        for (let version of versions) {

            let option: any = { value: version, display: version + '(' + refset.versionStatus + ')' };
            
            if (refset.versionStatus.toLowerCase() == 'in development'){
                option.value = CodeUtility.getCurrentDate();
            }

            if (version === refset.versionDate) {
                option.selected = true;
            }

            versionOptions.push(option);
        }

        if (versionOptions.length == 0){
            versionOptions = CodeUtility.clone(this.mockedVersionOptions);
        }

        return versionOptions
    }
}