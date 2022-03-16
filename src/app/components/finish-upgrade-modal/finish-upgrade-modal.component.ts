import { ChangeDetectorRef, Component, Input, OnInit } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { NgbModal } from '@ng-bootstrap/ng-bootstrap';
import { RefsetDetails } from 'src/app/pages/refset-details';
import { RefsetService } from 'src/app/services/rest/refset.service';
import { UiUtility } from 'src/app/utilities/ui.utility';
import { UpgradeModalComponent } from '../upgrade-modal/upgrade-modal.component';

@Component({
  selector: 'finish-upgrade-modal',
  templateUrl: './finish-upgrade-modal.component.html'
})
export class FinishUpgradeModalComponent implements OnInit {

  @Input()
  refsetData: any;
  @Input()
  membersOfRefset: any;
  @Input()
  inactiveConcepts: any;
  @Input()
  membersInCommon: any;

  constructor(private readonly modalService: NgbModal,
    readonly refsetDetails: RefsetDetails,
    readonly upgradeModalComponent: UpgradeModalComponent,
    private readonly refsetService: RefsetService) { }

  ngOnInit(): void {
  }

  openFinishUpgradeModal(finishUpgradeDialog: NgbModal) {
    this.modalService.dismissAll();
    this.modalService.open(finishUpgradeDialog, {
      backdrop: 'static',
      keyboard: false,
      windowClass: 'finish-upgrade-modal',
      size: 'lg'
    });

  }

  getInactiveChangeReport(): void {
    const memberItems = this.membersInCommon?.items;
    const inactiveConcepts = memberItems?.filter((items: any) => {
      return items?.active == false;
    });
    let data = [];
    for (let i = 0; i < inactiveConcepts?.length; i++) {
      data.push({
        'Inactive Concept ID': inactiveConcepts[i].code,
        'Inactive Concept': this.upgradeModalComponent.transformDescriptions(inactiveConcepts[i].descriptions).term.replaceAll(',', '/'),
        'Reason': inactiveConcepts[i].replacementConcecpts ? inactiveConcepts[i].replacementConcecpts[0].reason : '',
        'Suggested Replacement Concept ID': inactiveConcepts[i].replacementConcecpts ? inactiveConcepts[i].replacementConcecpts[0].code : '',
        'Suggested Replacement Concept': this.upgradeModalComponent.transformReplacementDescriptions(inactiveConcepts[i].replacementConcecpts ? inactiveConcepts[i].replacementConcecpts[0].descriptions : '').term.replaceAll(',', '/')
      });
    }

    UiUtility.createInactiveChangeReport(this.refsetData.refsetId, data);

  }

  getFinishedChangeReport(): void {

    this.refsetService.getUpgradeData(this.refsetData.id, '').subscribe((members) => {
      this.membersInCommon = members;
      // Get old members from inactive concepts
      let memberItems = this.membersInCommon?.items;
      let inactiveConcepts = memberItems?.filter((items: any) => {
        return items?.replaced === true;
      });
      let oldMembers = [];
      for (let i = 0; i < inactiveConcepts?.length; i++) {
        oldMembers.push({
          'Old Member ID': inactiveConcepts[i].replacementConcecpts ? inactiveConcepts[i].replacementConcecpts[0].code : '',
          'Old Member Concept': this.upgradeModalComponent.transformReplacementDescriptions(inactiveConcepts[i].replacementConcecpts ? inactiveConcepts[i].replacementConcecpts[0].descriptions : '').term.replaceAll(',', '/')
        });
      }

      // Get new members from inactive concepts
      memberItems = this.membersInCommon?.items;
      inactiveConcepts = memberItems?.filter((items: any) => {
        return items?.replaced === true;
      });
      let newMembers = [];
      for (let i = 0; i < inactiveConcepts?.length; i++) {
        newMembers.push({
          'New Member ID': inactiveConcepts[i].code,
          'New Member Concept': this.upgradeModalComponent.transformDescriptions(inactiveConcepts[i].descriptions).term.replaceAll(',', '/')
        });
      }

      // Get manual replacements from inactive concepts
      memberItems = this.membersInCommon?.items;
      inactiveConcepts = memberItems?.filter((items: any) => {
        return items?.replacementConcecpts[0].added === true;
      });
      let manualReplacement = [];
      for (let i = 0; i < inactiveConcepts?.length; i++) {
        manualReplacement.push({
          'Manual Replacement ID': inactiveConcepts[i].replacementConcecpts ? inactiveConcepts[i].replacementConcecpts[0].code : '',
          'Manual Replacement Concept': this.upgradeModalComponent.transformReplacementDescriptions(inactiveConcepts[i].replacementConcecpts ? inactiveConcepts[i].replacementConcecpts[0].descriptions : '').term.replaceAll(',', '/')
        });
      }

      // Get members in common
      const membersInCommonItems = this.membersOfRefset;
      const commonConcepts = membersInCommonItems?.filter((x) => {
        return !memberItems?.includes(x.id);
      });
      console.log(commonConcepts)
      let membersInCommon = [];
      for (let i = 0; i < commonConcepts?.length; i++) {
        membersInCommon.push({
          'Members In Common ID': commonConcepts[i].code,
          'Members In Common Concept': commonConcepts[i].name.replaceAll(',', '/')
        });
      }

      const changeReportObject = {
        'oldMember': oldMembers,
        'newMember': newMembers,
        'manualReplacement': manualReplacement,
        'membersInCommon': membersInCommon
      };
      UiUtility.createFinishedChangeReport(this.refsetData?.refsetId, changeReportObject);
    });
  }
}
