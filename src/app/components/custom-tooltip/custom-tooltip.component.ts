import { Component, NgZone } from '@angular/core';
import { Router } from '@angular/router';
import { ITooltipAngularComp } from 'ag-grid-angular';
import { ITooltipParams } from 'ag-grid-community';

@Component({
  selector: 'tooltip-component',
  template: `<ng-container *ngIf="params.column.colId === 'teams'">
    <div class="custom-tooltip">
            <p (click)="goToTeam(team.id, team.organizationId)" class="text-primary font-weight-bold" *ngFor="let team of this.teamArray">{{ team.name }}</p>
        </div>
    </ng-container>`,
  styles: [
    `
            :host {
                position: absolute;
                width: 150px;
                height: fit-content;
                overflow: hidden;
                border: 1px solid grey;
                background-color: white;
            }

            .custom-tooltip {
                white-space: nowrap;
                margin-top: 15px;
                padding-left: 10px;
                line-height: 5px;
            }

            .custom-tooltip p {
                cursor: pointer;
            }
    `,
  ],
})
export class CustomTooltipComponent implements ITooltipAngularComp {
  params: ITooltipParams;
  teamArray = [];

  constructor(private readonly router: Router, private readonly zone: NgZone) { }
  agInit(params: ITooltipParams): void {
    if (JSON.parse(params.data.teams).teams.length < 1) {
      return;
    } else {
      this.params = params;
      this.teamArray = JSON.parse(this.params.data.teams).teams;
    }
  }

  goToTeam(teamId: string, organizationId: string): void {
    this.zone.run(() => {
      this.router.navigate([`/organization/${organizationId}/teams/people/${teamId}`]);
    });
  }

}
