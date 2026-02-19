import { Component, Input, OnInit } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';

@Component({
	standalone: false,
	selector: 'app-sidebar',
	templateUrl: './sidebar.component.html',
	styleUrls: ['./sidebar.component.css'],
})
export class SidebarComponent implements OnInit {
	showSideBar = false;

	@Input() menuItems;
	@Input() id;

	constructor(private readonly route: ActivatedRoute, private readonly router: Router) {}

	ngOnInit() {
		this.route.params.subscribe((params) => {
			this.id = params['id'];
		});
	}

	goToLink(link) {
		this.router.navigate([link], { replaceUrl: false, skipLocationChange: false });
	}

	onMouseEnter(e: any) {
		const activeEl = document.getElementsByClassName('active')[0];
		// Dont change the color of active element
		if (e != activeEl) {
			activeEl.classList.add('unactive');
		}
	}

	onMouseOut(e: any) {
		const activeEl = document.getElementsByClassName('active')[0];
		// Dont change the color of active element
		if (e != activeEl) {
			activeEl.classList.remove('unactive');
		}
	}
}
