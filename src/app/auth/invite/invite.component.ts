import { Component, OnInit } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { RefsetService } from 'src/app/services/rest/refset.service';

@Component({
	selector: 'app-invite',
	template: '<div class="invite-main"></div>',
})
export class InviteComponent implements OnInit {
	requestId: any;
	accepted: any;

	constructor(private route: ActivatedRoute, private router: Router, private refsetService: RefsetService) {}

	inviteRequest(): any {
		this.refsetService.inviteRequest(this.requestId, this.accepted).subscribe();
		this.router.navigate([''], { replaceUrl: false, skipLocationChange: false });
	}

	ngOnInit(): void {
		this.route.queryParams.subscribe((params) => {
			this.requestId = params.ir;
			this.accepted = params.r;
			this.inviteRequest();
		});
	}
}
