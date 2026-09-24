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
	@Input() mapset: any;
	loggedIn = false;

	constructor(private authenticationService: AuthenticationService) {}

	get directUrl(): string {
		return this.mapset?.refsetId
			? window.location.protocol +
					'//' +
					window.location.host +
					'/details/' +
					this.mapset.refsetId +
					'/' +
					RefsetUtility.getVersionDateForRefsetApiCall(this.mapset)
			: '';
	}

	ngOnInit(): void {
		this.loggedIn = this.authenticationService.isAuthenticated();
	}

	getEditionUrl() {
		return `${window.location.origin}/organizations/${this.mapset?.edition.organizationId}/edition/${this.mapset?.editionId}/projects`;
	}

	getProjectUrl() {
		return `${window.location.origin}/organization/${this.mapset?.edition.organizationId}/edition/${this.mapset?.editionId}/projects/${this.mapset?.projectId}/refsets`;
	}

	setDescriptions(mapsetData: any): Array<string> {
		return mapsetData?.descriptions;
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
		if (this.mapset?.versionStatus === Constants.IN_DEVELOPMENT) {
			return 'Latest';
		}
		return versionList && versionList[0] ? `${versionList[0].date}` : '';
	}
}
