import {Component, Input, OnInit} from '@angular/core';
import {RefsetUtility} from '../../utilities/refset.utility';
import {Router} from '@angular/router';


@Component({
    selector: 'refset-meta',
    templateUrl: './refset-meta-table.component.html'
})

export class RefsetMetaTableComponent implements OnInit {
    showFlag = true;
    @Input() refset: any;

    constructor(private router: Router) {
    }

    get directUrl(): string {
        return (window.location.protocol + '//' + window.location.host + '/details/' + this.refset.refsetId + '/'
            + RefsetUtility.getVersionDateForRefsetApiCall(this.refset));
    }

    ngOnInit(): void {
    }

    setDescriptions(refsetData: any): Array<string> {
        return refsetData?.descriptions;
    }

    showFlagIcon(showFlag: boolean) {
        this.showFlag = showFlag;
    }

    capitalizeFirstLetterOfString(stringValue: string): string {
        if (stringValue) {
            return stringValue.replace(/(?:^|\s|[-"'([{])+\S/g, (c) =>
                c.toUpperCase()
            );
        }

        return stringValue;
    }

    toTitleCase(str) {
        return str?.replace(
            /\w\S*/g,
            function (txt) {
                return txt.charAt(0).toUpperCase() + txt.substr(1).toLowerCase();
            }
        );
    }

    latestDate(versionList: any[]): string {
        if (this.refset?.versionStatus === RefsetUtility.IN_DEVELOPMENT) {
            return 'Latest';
        }
        return versionList && versionList[0] ? `${versionList[0].date}` : '';
    }
}
