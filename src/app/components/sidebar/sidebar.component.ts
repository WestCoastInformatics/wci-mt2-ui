import { Component, Input, OnInit } from '@angular/core';
import { ActivatedRoute } from '@angular/router';

@Component({
	selector: 'app-sidebar',
	templateUrl: './sidebar.component.html',
	styleUrls: ['./sidebar.component.scss']
})
export class SidebarComponent implements OnInit {

	showSideBar = false;

	@Input() menuItems;
	@Input() id;

	constructor(private readonly route: ActivatedRoute) { }

	ngOnInit() {

		this.route.params.subscribe(params => {
			this.id = params['id'];
		});
	}

	getLink(itemLink) {
		return ([itemLink]);
	}

	onMouseEnter(e: any) {
		const activeEl = document.getElementsByClassName('active')[0]
		// Dont change the color of active element
		if (e != activeEl) {
			activeEl.classList.add('unactive')
		}
	}
	
	onMouseOut(e: any) {
		const activeEl = document.getElementsByClassName('active')[0]
		// Dont change the color of active element
		if (e != activeEl) {
			activeEl.classList.remove('unactive')
		}
	}
}
