import { Component, NgZone } from '@angular/core';
import { Router } from '@angular/router';
import { ITooltipAngularComp } from 'ag-grid-angular';
import { ITooltipParams } from 'ag-grid-community';

@Component({
  selector: 'tooltip-component',
  templateUrl: 'custom-tooltip.component.html',
  styleUrls: ['custom-tooltip.component.scss'],
})
export class CustomTooltipComponent implements ITooltipAngularComp {
  params: ITooltipParams;
  teamArray = [];

  constructor(private readonly router: Router, private readonly zone: NgZone) { }
  agInit(params: ITooltipParams): void {
    if (JSON.parse(params.data.teams).teams.length < 1) {
        this.teamArray = [];
      return;
    } else {
      this.params = params;
      this.teamArray = JSON.parse(this.params.data.teams).teams;
    }
  }

  goToTeam(teamId: string, organizationId: string): void {
    this.zone.run(() => {
      this.router.navigate([`/organization/${organizationId}/teams/${teamId}/people`]);
    });
  }

}
