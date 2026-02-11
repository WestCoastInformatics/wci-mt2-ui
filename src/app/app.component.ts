import { Component, OnInit, HostListener } from '@angular/core';
import 'jquery';
import { Title } from '@angular/platform-browser';
import { EnvService } from './services/environment/env.service';
import { NavigationStart, NavigationEnd, NavigationError, Router } from '@angular/router';
import { AuthenticationService } from './services/authentication/authentication.service';
import { filter } from 'rxjs/operators';
@Component({
	standalone: false,
	selector: 'app-root',
	templateUrl: './app.component.html',
	styleUrls: ['app.component.scss'],
})
export class AppComponent implements OnInit {
	versions: object;
	environment: string;
	history: string[] = [];

	constructor(private authenticationService: AuthenticationService, private envService: EnvService, private titleService: Title, private router: Router) {
		router.events.subscribe((event) => {
			if (event instanceof NavigationEnd) {
				const currentURL = event.urlAfterRedirects;
				let push = false;
				let urlID = '';

				if (localStorage.getItem('navigationHistory')) {
					this.history = JSON.parse(localStorage.getItem('navigationHistory'));
				}

				if (currentURL.includes('organization') || currentURL.includes('edition') || currentURL.includes('projects')) {
					const parts = currentURL.split('/');
					for (let p = 0; p < parts.length; p++) {
						if (parts[p].includes('organization')) {
							if (parts[p + 1] == '0') {
								urlID = parts[p + 1];
							}
						}
						if (parts[p].includes('edition')) {
							if (parts[p + 1] == '0') {
								urlID = parts[p + 1];
							}
						}
						if (parts[p].includes('projects')) {
							if (parts[p + 1] == '0') {
								urlID = parts[p + 1];
							}
						}
					}
					if (urlID != '0') {
						push = true;
					}
				} else {
					push = true;
				}

				if (currentURL === '/') {
					this.history = [];
					push = false;
					localStorage.setItem('navigationHistory', JSON.stringify(this.history));
				}

				if (this.history.length > -1) {
					if (this.history[this.history.length - 1] != undefined) {
						if (this.history[this.history.length - 1] == currentURL) {
							push = false;
						}
					}
				}
				if (push) {
					this.history.push(currentURL);
					localStorage.setItem('navigationHistory', JSON.stringify(this.history));
				}
			}
		});

		router.events
			.pipe(
				filter((event) => {
					return event instanceof NavigationStart && event.navigationTrigger === 'popstate';
				})
			)
			.subscribe((event: NavigationStart) => {
				location.reload();
			});

		router.events.pipe(filter((event) => event instanceof NavigationError)).subscribe(() => router.navigate(['/dashboard'], { skipLocationChange: true }));
	}

	// ***** Framework Functions *****/
	ngOnInit() {
		this.titleService.setTitle('Mapping Tool');
		this.environment = this.envService.env;

		this.assignFavicon();

		this.authenticationService.prepareUserSession();
	}

	assignFavicon() {
		const favicon = $('#favicon');

		switch (this.environment) {
			case 'local':
				favicon.attr('href', 'src/assets/favicon/favicon_purple.ico');
				break;
			case 'dev':
				favicon.attr('href', 'src/assets/favicon/favicon_green.ico');
				break;
			case 'uat':
				favicon.attr('href', 'src/assets/favicon/favicon_blue.ico');
				break;
			case 'training':
				favicon.attr('href', 'src/assets/favicon/favicon_yellow.ico');
				break;
			default:
				favicon.attr('href', 'src/assets/favicon/favicon_red.ico');
				break;
		}
	}

	@HostListener('window:popstate')
	onPopState() {
		if (localStorage.getItem('navigationHistory')) {
			this.history = JSON.parse(localStorage.getItem('navigationHistory'));
		}
		if (this.history.length > -1) {
			if (this.history[this.history.length - 1] != undefined) {
				this.history.pop();
				this.router.navigate([this.history[this.history.length - 1]]).then(() => {
					window.location.reload();
				});
				localStorage.setItem('navigationHistory', JSON.stringify(this.history));
			} else {
				this.router.navigate(['/dashboard']);
			}
		} else {
			this.router.navigate(['/dashboard']);
		}
	}
}
