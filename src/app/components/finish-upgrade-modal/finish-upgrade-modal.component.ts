import { ChangeDetectorRef, Component, Input, OnInit } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { NgbModal } from '@ng-bootstrap/ng-bootstrap';
import { RefsetDetails } from 'src/app/pages/refset-details';
import { RefsetService } from 'src/app/services/rest/refset.service';
import { CodeUtility } from 'src/app/utilities/code.utility';
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

  getConceptName(descriptionsString) {

    let conceptName: any = '';

    let descriptions = JSON.parse(descriptionsString);

    if (CodeUtility.hasValue(descriptions) && CodeUtility.hasValue(descriptions[0]?.term)) {
      conceptName = descriptions[0].term;
    } else {

      for (let i = 1; i < descriptions.length; i++) {

        if (descriptions[i].language == 'en' && descriptions[i].type == 'PT') {

          conceptName = descriptions[i].term;
          break;
        }
      }
    }

    conceptName = conceptName.replaceAll(',', '/');

    return conceptName;
  }

  getReplacementConceptName(inactiveConcept) {

    let replacementName: any = '';

    if (inactiveConcept.replacementConcepts) {
      replacementName = this.getConceptName(inactiveConcept.replacementConcepts[0].descriptions);
    }

    return replacementName;
  }

  formatReason(reason: string): string {
    return reason?.split('_').join(' ');
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
        'Inactive Concept': this.getConceptName(inactiveConcepts[i].descriptions),
        'Suggested Replacement Association': inactiveConcepts[i].replacementConcepts ? inactiveConcepts[i].replacementConcepts[0].reason : '',
        'Suggested Replacement ID': inactiveConcepts[i].replacementConcepts ? inactiveConcepts[i].replacementConcepts[0].code : '',
        'Suggested Replacement Concept': this.getReplacementConceptName(inactiveConcepts[i])
      });
    }

    UiUtility.createInactiveChangeReport(this.refsetData.refsetId, data);

  }

  getFinishedChangeReport(): void {

    // Get old members from inactive concepts
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
          'id': concept.id,
          'effectiveTime': new Date(concept.memberEffectiveTime).toISOString().split('T')[0].replace(/[-]/g, '').includes('Invalid Date') ? '' : new Date(concept.memberEffectiveTime).toISOString().split('T')[0].replace(/[-]/g, ''),
          'active': concept.active ? '1' : '0',
          'moduleId': this.refsetData?.moduleId,
          'refsetId': this.refsetData?.refsetId
        });
      }
    }


    // Get new members from inactive concepts
    inactiveConcepts = [];
    memberItems.forEach((item: any) => {
      if (item.replaced === true || item.stillMember === false) {
        inactiveConcepts.push(item);
      }
    });
    let oldMembers = [];
    for (let concept of inactiveConcepts) {
      if (!Boolean(oldMembers.some((x) => {
        return x['Old Member ID'] === concept.code;
      }))) {
        oldMembers.push({
          'id': concept.id,
          'effectiveTime': new Date(concept.memberEffectiveTime).toISOString().split('T')[0].replace(/[-]/g, '').includes('Invalid Date') ? '' : new Date(concept.memberEffectiveTime).toISOString().split('T')[0].replace(/[-]/g, ''),
          'active': concept.active ? '1' : '0',
          'moduleId': this.refsetData?.moduleId,
          'refsetId': this.refsetData?.refsetId
        });
      }
    }

    // Get all inactive concepts
    const items = this.membersInCommon.items;
    inactiveConcepts = items.filter((items: any) => {
      return items?.active == false;
    });

    let totalInactiveConcepts = [];


    for (let i = 0; i < inactiveConcepts.length; i++) {
      totalInactiveConcepts.push({
        'Inactive Concept ID': inactiveConcepts[i].code,
        'Inactive Concept FSN': this.getConceptName(inactiveConcepts[i].descriptions)[0].term,
        'Reason': this.formatReason(inactiveConcepts[i].inactivationReason),
        'Suggested Replacement ConceptID(s)': inactiveConcepts[i].replacementConcepts ? inactiveConcepts[i].replacementConcepts[0].code : '',
        'Suggested Replacement FSN(s)': this.getReplacementConceptName(inactiveConcepts[i].descriptions)[0].term
      });
    }

    // Get members in common
    const membersInCommonItems = this.membersOfRefset;
    const commonConcepts = membersInCommonItems?.filter((x) => {
      return !memberItems?.includes(x.id);
    });

    let membersInCommon = [];
    for (let i = 0; i < commonConcepts?.length; i++) {
      membersInCommon.push({
        'id': commonConcepts[i].id,
        'effectiveTime': new Date(commonConcepts[i].memberEffectiveTime).toISOString().split('T')[0].replace(/[-]/g, ''),
        'active': commonConcepts[i].active ? '1' : '0',
        'moduleId': this.refsetData?.moduleId,
        'refsetId': this.refsetData?.refsetId
      });
    }

    const changeReportObject = {
      'newMember': newMembers,
      'oldMember': oldMembers,
      'totalInactiveConcepts': totalInactiveConcepts,
      'membersInCommon': membersInCommon
    };
    UiUtility.createFinishedChangeReport(this.refsetData?.refsetId, changeReportObject);
  }
}
