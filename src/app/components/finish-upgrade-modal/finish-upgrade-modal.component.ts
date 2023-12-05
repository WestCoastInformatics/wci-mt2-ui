import { Component, Input, OnInit } from '@angular/core';
import { NgbModal } from '@ng-bootstrap/ng-bootstrap';
import { MapsetDetailsComponent } from 'src/app/pages/mapset-details/mapset-details.component';
import { CodeUtility } from 'src/app/utilities/code.utility';
import { UiUtility } from 'src/app/utilities/ui.utility';
import { UpgradeModalComponent } from '../upgrade-modal/upgrade-modal.component';

@Component({
	selector: 'finish-upgrade-modal',
	templateUrl: './finish-upgrade-modal.component.html',
	styleUrls: ['finish-upgrade-modal.component.scss'],
})
export class FinishUpgradeModalComponent implements OnInit {
	@Input() refsetData: any;
	@Input() membersOfRefset: any;
	@Input() inactiveConcepts: any;
	@Input() membersInCommonForChangeReport: any;
	@Input() membersInCommon: any;
	@Input() isLocked: boolean;

	constructor(private readonly modalService: NgbModal, readonly refsetDetails: MapsetDetailsComponent, readonly upgradeModalComponent: UpgradeModalComponent) {}

	ngOnInit(): void {}

	openFinishUpgradeModal(finishUpgradeDialog: NgbModal) {
		this.modalService.dismissAll();
		this.modalService.open(finishUpgradeDialog, {
			backdrop: 'static',
			keyboard: false,
			windowClass: 'finish-upgrade-modal',
			size: 'lg',
		});
	}

	getConceptName(descriptionsString) {
		let conceptName: any = '';

		const descriptions = JSON.parse(descriptionsString);

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
		const data = [];
		for (let i = 0; i < inactiveConcepts.length; i++) {
			data.push({
				'Inactivation Reason': inactiveConcepts[i].inactivationReason ? inactiveConcepts[i].inactivationReason : '',
				'Inactive ID': inactiveConcepts[i].inactivationReason ? inactiveConcepts[i].code : '',
				'Inactive Concept': this.getConceptName(inactiveConcepts[i].descriptions),
				'Suggested Replacement Association': inactiveConcepts[i].replacementConcepts ? inactiveConcepts[i].replacementConcepts[0].reason : '',
				'Suggested Replacement ID': inactiveConcepts[i].replacementConcepts ? inactiveConcepts[i].replacementConcepts[0].code : '',
				'Suggested Replacement Concept': this.getReplacementConceptName(inactiveConcepts[i]),
			});
		}

		UiUtility.createInactiveChangeReport(this.refsetData.refsetId, data);
	}

	// NOTE: this is duplicated in "finish-upgrade-modal" component also - is that used??
	getFinishedChangeReport(): void {
		// Get old members from inactive concepts
		const memberItems = this.membersInCommonForChangeReport?.items;
		let inactiveConcepts = [];
		memberItems.forEach((items: any) => {
			if (items.replacementConcepts) {
				for (const item of items.replacementConcepts) {
					if (item.added === true) {
						// skip duplicate entries (same code)
						if (inactiveConcepts.filter((c) => c.code == item.code).length > 0) {
							continue;
						}
						inactiveConcepts.push(item);
					}
				}
			}
		});

		let newMembers = [];
		for (const concept of inactiveConcepts) {
			if (
				!newMembers.some((x) => {
					return x['New Member ID'] === concept.code;
				})
			) {
				const item = {
					'id': concept.memberId,
					'effectiveTime': concept.memberEffectiveTime ? new Date(concept.memberEffectiveTime).toISOString().split('T')[0].replace(/[-]/g, '') : '',
					'active': concept.active ? '1' : '0',
					'moduleId': this.refsetData?.moduleId,
					'refsetId': this.refsetData?.refsetId,
					'referencedComponentId': concept.code,
				};
				// Skip duplicate referencedComponentId (shouldn't be possible because of de-dup above)
				if (newMembers.filter((c) => c.referencedComponentId == item.referencedComponentId).length > 0) {
					continue;
				}
				newMembers.push(item);
			}
		}

		// Sort by referencedComponentId
		newMembers = newMembers.sort((a, b) => (a.referencedComponentId > b.referencedComponentId ? 1 : -1));

		// Get new members from inactive concepts
		inactiveConcepts = [];
		memberItems.forEach((item: any) => {
			if (item.replaced === true || item.stillMember === false) {
				// only add if not a duplicate
				if (inactiveConcepts.filter((c) => c.code == item.code).length == 0) {
					inactiveConcepts.push(item);
				}
			}
		});
		let oldMembers = [];
		for (const concept of inactiveConcepts) {
			if (
				!oldMembers.some((x) => {
					return x['Old Member ID'] === concept.code;
				})
			) {
				if (oldMembers.length > 0 && oldMembers.find((item) => item.id === concept.memberId)) {
					continue;
				}
				const item = {
					'id': concept.memberId,
					'effectiveTime': concept.memberEffectiveTime ? new Date(concept.memberEffectiveTime).toISOString().split('T')[0].replace(/[-]/g, '') : '',
					'active': concept.active ? '1' : '0',
					'moduleId': this.refsetData?.moduleId,
					'refsetId': this.refsetData?.refsetId,
					'referencedComponentId': concept.code,
				};
				// skip duplicates
				if (oldMembers.filter((c) => c.referencedComponentId == item.referencedComponentId).length > 0) {
					continue;
				}
				oldMembers.push(item);
			}
		}

		// Sort by referencedComponentId
		oldMembers = oldMembers.sort((a, b) => (a.referencedComponentId > b.referencedComponentId ? 1 : -1));

		// Get all inactive concepts
		const items = this.membersInCommon.items;
		inactiveConcepts = items.filter((items: any) => {
			return items?.active == false;
		});

		let totalInactiveConcepts = [];

		for (let i = 0; i < inactiveConcepts.length; i++) {
			const item = {
				'Inactive Concept ID': inactiveConcepts[i].code,
				'Inactive Concept Name': this.getConceptName(inactiveConcepts[i].descriptions),
				'Reason': this.formatReason(inactiveConcepts[i].inactivationReason),
				'Suggested Replacement Association': inactiveConcepts[i].replacementConcepts ? inactiveConcepts[i].replacementConcepts[0].reason : '',
				'Suggested Replacement ConceptID(s)': inactiveConcepts[i].replacementConcepts ? inactiveConcepts[i].replacementConcepts[0].code : '',
				'Suggested Replacement Name': this.getReplacementConceptName(inactiveConcepts[i]),
			};
			// skip duplicates
			if (totalInactiveConcepts.filter((c) => c['Suggested Replacement ConceptID(s)'] == item['Suggested Replacement ConceptID(s)']).length > 0) {
				continue;
			}
			totalInactiveConcepts.push(item);
		}

		// Sort by Inactive Concept ID
		totalInactiveConcepts = totalInactiveConcepts.sort((a, b) => (a['Inactive Concept ID'] > b['Inactive Concept ID'] ? 1 : -1));

		// Get members in common
		const membersInCommonItems = this.membersOfRefset;
		const commonConcepts = membersInCommonItems?.filter((x) => {
			return !memberItems?.includes(x.id);
		});

		let membersInCommon = [];
		for (let i = 0; i < commonConcepts?.length; i++) {
			const item = {
				'id': commonConcepts[i].memberId,
				'effectiveTime': commonConcepts[i].memberEffectiveTime ? new Date(commonConcepts[i].memberEffectiveTime).toISOString().split('T')[0].replace(/[-]/g, '') : '',
				'active': commonConcepts[i].active ? '1' : '0',
				'moduleId': this.refsetData?.moduleId,
				'refsetId': this.refsetData?.refsetId,
				'referencedComponentId': commonConcepts[i].code,
			};
			// skip duplicates
			if (membersInCommon.filter((c) => c.referencedComponentId == item.referencedComponentId).length > 0) {
				continue;
			}
			membersInCommon.push(item);
		}

		// Sort by referencedComponentId
		membersInCommon = membersInCommon.sort((a, b) => (a.referencedComponentId > b.referencedComponentId ? 1 : -1));

		const changeReportObject = {
			'newMember': newMembers,
			'oldMember': oldMembers,
			'totalInactiveConcepts': totalInactiveConcepts,
			'membersInCommon': membersInCommon,
		};
		UiUtility.createFinishedChangeReport(this.refsetData?.refsetId, changeReportObject);
	}
}
