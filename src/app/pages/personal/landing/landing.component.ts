import { Component, OnDestroy, OnInit } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { Subscription } from 'rxjs';
import { AuthenticationService } from 'src/app/services/authentication/authentication.service';
import { RefsetService } from 'src/app/services/rest/refset.service';
import { PersonalComponentService } from 'src/app/pages/personal/personal-component.service';
import { UiUtility } from 'src/app/utilities/ui.utility';

@Component({
	selector: 'personal-landing',
	templateUrl: './landing.component.html',
	styleUrls: ['landing.component.scss'],
})
export class PersonalLandingComponent implements OnInit, OnDestroy {
	routerParamsSubscription: Subscription;
	routerEventSubscription: Subscription;
	selectedTeam: any;
	userId: any;
	user: any;
	todayDate: Date = new Date();
	organizationList = [];
	teamList = [];
	uiUtility = UiUtility;
	loggedUserId: string;
	currentURL: string;
	personalSubscription: Subscription;

	constructor(
		private readonly authService: AuthenticationService,
		private readonly refsetService: RefsetService,
		private readonly personalComponentService: PersonalComponentService,
		private readonly route: ActivatedRoute,
		private readonly router: Router
	) {}

	ngOnInit(): void {
		this.loggedUserId = this.authService.getUser().id;

		this.routerParamsSubscription = this.route.params.subscribe((params) => {
			if (params['userId']) {
				this.userId = params['userId'];
			} else {
				this.userId = this.authService.getUser().id;
			}
		});

		this.routerEventSubscription = this.router.events.subscribe((event) => {
			if (this.router.url.includes('personal')) {
				this.checkLocationPath(this.router.url);
			} else {
				this.ngOnDestroy();
			}
		});
		this.getUser();
	}

	checkLocationPath(url) {
		if (this.currentURL != url) {
			this.currentURL = url;
			const parts = url.split('/');
			for (let p = 0; p < parts.length; p++) {
				if (parts[p].includes('personal')) {
					if (parts[p + 1] != undefined) {
						this.userId = parts[p + 1];
					}
				}
			}

			if (this.userId) {
				this.user = '';
				this.organizationList = [];
				this.teamList = [];
				this.getUser();
			}
		}
	}

	getUser(): void {
		this.personalSubscription = this.personalComponentService.getUser().subscribe({
			next: (results) => {
				this.user = results;
				this.getTeams();
				this.getOrganizations();
			},
		});
	}

	getOrganizations(): void {
		this.refsetService.getOrganizations().subscribe((results) => {
			this.organizationList = results.items;
		});
	}

	getTeams(): void {
		this.refsetService.getTeams('sort=name&sortAscending=true').subscribe((results) => {
			this.teamList = results.items.filter((i) => {
				return i.members.indexOf(this.userId) > -1;
			});
		});
	}

	goToTeam(teamId: string, organizationId: string): void {
		this.router.navigate([`/organization/${organizationId}/teams/${teamId}/users`]);
	}

	navigateToPage(path) {
		this.router.navigate([path]);
	}

	ngOnDestroy() {
		if (this.routerParamsSubscription) {
			this.routerParamsSubscription.unsubscribe();
		}
		if (this.routerEventSubscription) {
			this.routerEventSubscription.unsubscribe();
		}
		if (this.personalSubscription) {
			this.personalSubscription.unsubscribe();
		}
	}
}
