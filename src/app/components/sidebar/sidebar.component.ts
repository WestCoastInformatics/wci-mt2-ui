import { Component, Input, OnInit } from '@angular/core';
import { ActivatedRoute } from '@angular/router';

@Component({
	selector: 'app-sidebar',
	templateUrl: './sidebar.component.html'
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
}
