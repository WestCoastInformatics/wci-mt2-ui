import { ChangeDetectorRef, Component, Input, SimpleChanges, ViewChild } from '@angular/core';
import { TreeComponent, TreeModel, TreeNode } from '@circlon/angular-tree-component';
import { TreeOptionDefaults, TreeOptions } from 'src/app/models/tree-options.model';
import { CodeUtility } from 'src/app/utilities/code.utility';
import { RefsetUtility } from 'src/app/utilities/refset.utility';

/**
 * Taxonomy data with nested structure.
 * Each node has a name and an optional list of children.
 */

/**
 * @title Tree with nested nodes
 */
@Component({
    selector: 'app-taxonomy-tree',
    templateUrl: 'taxonomy-tree.component.html'
})

export class TaxonomyTreeComponent {

    configOptions: TreeOptions = {};
    staticOptions: any = { nodeClass: this.styleNodeClass };
    refsetUtility = RefsetUtility;

    @Input() treeId: string = 'taxonomyTree';
    @Input() nodes: any[];
    @Input() options: TreeOptions = {};

    @ViewChild(TreeComponent) treeComponent: TreeComponent;

    constructor(private changeDetectorRef: ChangeDetectorRef,) {

        this.configOptions = {
            ...this.staticOptions,
            ...TreeOptionDefaults,
            ...this.options,
        };
    }

    ngOnChanges(changes: SimpleChanges) {

        for (const propertyName in changes) {

            if (propertyName === 'options') {

                this.configOptions = {
                    ...this.staticOptions,
                    ...TreeOptionDefaults,
                    ...this.options,
                };

                this.changeDetectorRef.detectChanges();
            }
        }
    }

    onInitTree(event) {

        let treeModel: TreeModel = this.treeComponent.treeModel;
        let firstNode: TreeNode = treeModel.getFirstRoot();
        firstNode.expand();
    }

    styleNodeClass(node: TreeNode) {

        let classes = '';

        if (CodeUtility.testBoolean(node.data.hasChildrenRefsetMembers)) {
            classes += ' refset-tool-taxonomy-relation-members';
        }

        if (CodeUtility.testBoolean(node.data.memberOfRefset)) {
            classes += ' refset-tool-taxonomy-is-member';

        } else {

            if (CodeUtility.testBoolean(node.data.hasChildrenRefsetMembers)) {
                classes += ' refset-tool-taxonomy-is-not-member';
            } else {
                classes += ' refset-tool-taxonomy-no-members-in-branch';
            }

        }

        return classes;
    }

    getNodeText(node){

        let text = '';
        let index = node.treeModel.options.options.displayField;
        let choosenDescription = node.data.descriptions[index];

        if (choosenDescription != null){
            text = choosenDescription.term;
        } else {
            text = node.data.descriptions[0].term;
        }

        return text;
    }
}