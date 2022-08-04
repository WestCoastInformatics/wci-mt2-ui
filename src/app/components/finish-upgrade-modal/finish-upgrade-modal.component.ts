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
  membersInCommonForChangeReport: any;
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
    const memberItems = this.membersInCommon.items;
    const inactiveConcepts = memberItems.filter((items: any) => {
      return items?.active == false;
    });
    let data = [];
    for (let i = 0; i < inactiveConcepts.length; i++) {
      data.push({
        'Inactivation Reason': inactiveConcepts[i].inactivationReason ? inactiveConcepts[i].inactivationReason : '',
        'Inactive ID': inactiveConcepts[i].inactivationReason ? inactiveConcepts[i].code : '',
        'Inactive Concept': inactiveConcepts[i].descriptions ? this.upgradeModalComponent.transformDescriptions(inactiveConcepts[i].descriptions).term.replaceAll(',', '/') : '',
        'Suggested Replacement Association': inactiveConcepts[i].replacementConcepts ? inactiveConcepts[i].replacementConcepts[0].reason : '',
        'Suggested Replacement ID': inactiveConcepts[i].replacementConcepts ? inactiveConcepts[i].replacementConcepts[0].code : '',
        'Suggested Replacement Concept': this.upgradeModalComponent.transformDescriptions(inactiveConcepts[i].replacementConcepts ? inactiveConcepts[i].replacementConcepts[0].descriptions : '').term.replaceAll(',', '/')
      });
    }

    UiUtility.createInactiveChangeReport(this.refsetData.refsetId, data);

  }

  getFinishedChangeReport(): void {

    let memberItems = this.membersInCommonForChangeReport?.items;
    let inactiveConcepts = [];
    memberItems.forEach((items: any) => {
      if (items.replacementConcepts) {
        for (let item of items.replacementConcepts) {
          if (item.added === true) {
            inactiveConcepts.push(item);
          }
        }
      }
    });

    let newMembers = [];
    for (let concept of inactiveConcepts) {
      if (!Boolean(newMembers.some((x) => {
        return x['New Member ID'] === concept.code;
      }))) {
        newMembers.push({
          'New Member ID': concept.code,
          'New Member Concept': this.upgradeModalComponent.transformDescriptions(concept.descriptions).term.replaceAll(',', '/')
        });
      }
    }

    // Get new members from inactive concepts
    inactiveConcepts = [];
    memberItems.forEach((item: any) => {
      if (item.replaced === true) {
        inactiveConcepts.push(item);
      }
    });
    let oldMembers = [];
    for (let concept of inactiveConcepts) {
      if (!Boolean(oldMembers.some((x) => {
        return x['Old Member ID'] === concept.code;
      }))) {
        oldMembers.push({
          'Old Member ID': concept.code,
          'Old Member Concept': this.upgradeModalComponent.transformDescriptions(concept.descriptions).term.replaceAll(',', '/')
        });
      }
    }

    // Get manual replacements from inactive concepts
    inactiveConcepts = [];
    memberItems.forEach((items: any) => {
      if (items.replacementConcepts) {
        for (let item of items.replacementConcepts) {
          if (item.reason === 'MANUAL_REPLACEMENT') {
            inactiveConcepts.push(item);
          }
        }
      }
    });

    let manualReplacement = [];
    for (let concept of inactiveConcepts) {
      if (!Boolean(manualReplacement.some((x) => {
        return x['Manual Replacement ID'] === concept.code;
      }))) {
        manualReplacement.push({
          'Manual Replacement ID': concept.code,
          'Manual Replacement Concept': this.upgradeModalComponent.transformDescriptions(concept.descriptions).term.replaceAll(',', '/')
        });
      }
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
  }
}
