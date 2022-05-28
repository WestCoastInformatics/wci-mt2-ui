import { Component, Input, OnInit } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { CodeUtility } from 'src/app/utilities/code.utility';

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

		if (CodeUtility.hasValue(this.id, true, true)) {
			return ([itemLink, this.id]);
		} else {
			return ([itemLink]);
		}
	}
}
