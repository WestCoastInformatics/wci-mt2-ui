import { Component, Input, OnInit } from '@angular/core';
import { RefsetUtility } from '../../utilities/refset.utility';
import { Constants } from '../../utilities/constants.utility';
import { AuthenticationService } from '../../services/authentication/authentication.service';

@Component({
	standalone: false,
	selector: 'mapset-meta',
	templateUrl: './mapset-meta-table.component.html',
	styleUrls: ['mapset-meta-table.component.css'],
})
export class MapsetMetaTableComponent implements OnInit {
	@Input() refset: any;
	loggedIn = false;

	constructor(private authenticationService: AuthenticationService) {}

	get directUrl(): string {
		return this.refset?.refsetId
			? window.location.protocol +
					'//' +
					window.location.host +
					'/details/' +
					this.refset.refsetId +
					'/' +
					RefsetUtility.getVersionDateForRefsetApiCall(this.refset)
			: '';
	}

	ngOnInit(): void {
		this.loggedIn = this.authenticationService.isAuthenticated();
	}

	getEditionUrl() {
		return `${window.location.origin}/organizations/${this.refset?.edition.organizationId}/edition/${this.refset?.editionId}/projects`;
	}

	getProjectUrl() {
		return `${window.location.origin}/organization/${this.refset?.edition.organizationId}/edition/${this.refset?.editionId}/projects/${this.refset?.projectId}/refsets`;
	}

	setDescriptions(refsetData: any): Array<string> {
		return refsetData?.descriptions;
	}

	showFlagIcon(event: Event) {
		(event.target as HTMLImageElement).style.display = 'none';
	}

	capitalizeFirstLetterOfString(stringValue: string): string {
		if (stringValue) {
			return stringValue.replace(/(?:^|\s|[-"'([{])+\S/g, (c) => c.toUpperCase());
		}

		return stringValue;
	}

	toTitleCase(str) {
		return str?.replace(/\w\S*/g, function (txt) {
			return txt.charAt(0).toUpperCase() + txt.substr(1).toLowerCase();
		});
	}

	latestDate(versionList: any[]): string {
		if (this.refset?.versionStatus === Constants.IN_DEVELOPMENT) {
			return 'Latest';
		}
		return versionList && versionList[0] ? `${versionList[0].date}` : '';
	}
}
