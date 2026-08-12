import { ChangeDetectorRef, Component, EventEmitter, OnInit, Output, TemplateRef, ViewChild } from '@angular/core';
import { Router } from '@angular/router';
import { User } from 'src/app/models/user';
import { AuthenticationService } from 'src/app/services/authentication/authentication.service';

@Component({
	standalone: false,
	selector: 'landing',
	templateUrl: './landing-page.component.html',
	styleUrls: ['./landing-page.component.css'],
})
export class LandingComponent implements OnInit {
	user?: User;
	showLoadingSpinner = false;
	@Output() loadingSpinner = new EventEmitter<boolean>(false);

	constructor(
		private router: Router,
		private changeDetectorRef: ChangeDetectorRef,
		private authenticationService: AuthenticationService,
	) {
		document.body.scrollTop = 0;
	}

	ngOnInit(): void {
		// this.user = this.authenticationService.getUser();
		// if (this.user) {
		// 	this.router.navigate(['/dashboard'], { replaceUrl: false, skipLocationChange: false });
		// }
	}

	login(): void {
		this.authenticationService.login();
	}
}
