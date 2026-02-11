import { Component, OnInit } from '@angular/core';
import { Router, RoutesRecognized } from '@angular/router';
import { AuthenticationService } from '../../services/authentication/authentication.service';

declare global {
	interface Window {
		ATL_JQ_PAGE_PROPS: any;
	}
}

window.ATL_JQ_PAGE_PROPS = window.ATL_JQ_PAGE_PROPS || {};

@Component({
	standalone: false,
	selector: 'app-footer',
	templateUrl: './footer.component.html',
	styleUrls: ['./footer.component.scss'],
})
export class FooterComponent implements OnInit {
	year: number = new Date().getFullYear();
	isUserLoggedIn = false;

	constructor(private router: Router, private authenticationService: AuthenticationService) {}

	ngOnInit() {
		this.router.events.subscribe((event: any) => {
			if (event instanceof RoutesRecognized) {
				if (event.url.split('/')[1] !== '') {
					this.initiateFeedbackScript();
				}
				this.isUserLoggedIn = this.authenticationService.isAuthenticated();
			}
		});
	}

	initiateFeedbackScript() {
		jQuery.ajax({
			url: 'https://jira.ihtsdotools.org/s/373e93f7c4bfcd2355dbf6c3bc2becfc-T/xqix14/813006/fe47b4489ac981edbb824b5107716c37/4.0.4/_/download/batch/com.atlassian.jira.collector.plugin.jira-issue-collector-plugin:issuecollector/com.atlassian.jira.collector.plugin.jira-issue-collector-plugin:issuecollector.js?locale=en&collectorId=b88ec472',
			type: 'get',
			cache: true,
			dataType: 'script',
		});

		window.ATL_JQ_PAGE_PROPS = {
			'triggerFunction': function (showCollectorDialog) {
				jQuery('#submit').on('click', function (e) {
					e.preventDefault();
					showCollectorDialog();
				});
			},
		};
	}

	openFeedbackModal() {
		$('#atlwdg-trigger').click();
	}
}
