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
    @Input() manualStateRefresh = false;

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

            if (CodeUtility.hasValue(this.nodes) && (propertyName === 'options' || propertyName === 'manualStateRefresh')) {

                this.configOptions = {
                    ...this.staticOptions,
                    ...TreeOptionDefaults,
                    ...this.options,
                };

                let treeModel: TreeModel = this.treeComponent.treeModel;
                let firstNode: TreeNode = treeModel.getFirstRoot();
                this.sortTree(treeModel.nodes);

                this.changeDetectorRef.detectChanges();

            } else if (propertyName === 'nodes' && CodeUtility.hasValue(this.nodes)) {
                this.sortTree(this.nodes);
            }
        }
    }

    onInitTree(event) {

        if (!CodeUtility.hasValue(this.nodes)) {
            return;
        }

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
            
        } else if (node.data.descriptions[0] != null) {
            text = node.data.descriptions[0].term;
        } else {
            text = node.data.name;
        }

        return text;
    }

    sortTree(nodes) {

		for (const node of nodes) {

			// If the element of the array has a property _children_, we sort the childrens, then parse them
			if (CodeUtility.hasValue(node.children)) {

				node.children = this.sortNodes(node.children);
				this.sortTree(node.children);
			}
		}
	}

	sortNodes(nodes) {

		return nodes.sort(function (node1, node2) {

			if (node1.name < node2.name) {
				return -1;
			} else if (node1.name > node2.name) {
				return 1;
			} else {
				return 0;
			}
		});
	}
}