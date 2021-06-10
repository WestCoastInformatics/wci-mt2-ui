import { ChangeDetectorRef, Component, Input, SimpleChanges, ViewChild } from '@angular/core';
import { TreeComponent, TreeModel, TreeNode } from '@circlon/angular-tree-component';
import { lastValueFrom, Observable } from 'rxjs';
import { TreeOptionDefaults, TreeOptions } from 'src/app/models/tree-options.model';
import { RefsetService } from 'src/app/services/rest/refset.service';
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
    nodes: any[] = [];
    refsetUtility = RefsetUtility;

    @Input() treeId: string = 'taxonomyTree';
    @Input() refset: any;
    @Input() rootNode: any;
    @Input() options: TreeOptions = {};
    @Input() manualStateRefresh = false;

    @ViewChild(TreeComponent) treeComponent: TreeComponent;

    constructor(private changeDetectorRef: ChangeDetectorRef, private refsetService: RefsetService,) {

        this.configOptions = {
            ...this.staticOptions,
            ...TreeOptionDefaults,
            ...this.options,
            getChildren: this.getChildren.bind(this)
        };
    }

    ngOnChanges(changes: SimpleChanges) {
        
        for (const propertyName in changes) {

            if (CodeUtility.hasValue(this.nodes) && (propertyName === 'options' || propertyName === 'manualStateRefresh')) {

                this.configOptions = {
                    ...this.staticOptions,
                    ...TreeOptionDefaults,
                    ...this.options,
                    getChildren: this.getChildren.bind(this)
                };

                let treeModel: TreeModel = this.treeComponent.treeModel;
                this.sortTree(treeModel.nodes);

                this.changeDetectorRef.detectChanges();

            } else if (propertyName === 'rootNode' && CodeUtility.hasValue(this.rootNode)) {
                
                let depth: number = 1

                let restParams = {
                    displayType: 'taxonomy',
                    depth: depth,
                    startingConceptId: this.rootNode.code,
                    offset: 0,
                    limit: 1000
                };
        
                this.refsetService.getMembersList(this.refset.id, restParams).subscribe(results => {
        
                    RefsetUtility.setEmptyChildrenNull(results.items);
                    this.rootNode.children = results.items;
                    this.sortTree([this.rootNode]);
                    this.nodes = [this.rootNode];
                });
            }
        }
    }

    onInitTree(event) {

        if (!CodeUtility.hasValue(this.nodes)) {
            return;
        }

        if (this.configOptions.expandFirstNode) {

            let treeModel: TreeModel = this.treeComponent.treeModel;
            let firstNode: TreeNode = treeModel.getFirstRoot();
            firstNode.expand();
        }
    }

    async getChildren(node: TreeNode) {

        let restParams = {
            displayType: 'taxonomy',
            depth: 1,
            startingConceptId: node.data.code,
            offset: 0,
            limit: 1000
        };

        // need to return a promise or the data to the tree, not an observable
        let results$: Observable<any> = this.refsetService.getMembersList(this.refset.id, restParams);
        let resultData: any = await lastValueFrom(results$);
        let data = resultData.items; 

        RefsetUtility.setEmptyChildrenNull(data);
        this.sortTree([{children: data}]);
        return data;
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
        let index = this.options.displayField;
        let data = node.data;

        if (!CodeUtility.hasValue(data)){
            data = node;
        }

        let choosenDescription = data.descriptions[index];

        if (choosenDescription != null){
            text = choosenDescription.term;
            
        } else if (data.descriptions[0] != null) {
            text = data.descriptions[0].term;
        } else {
            text = data.name;
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

		return nodes.sort((node1, node2) => {

            let name1 = this.getNodeText(node1);
            let name2 = this.getNodeText(node2);

            let compareValue = name1.localeCompare(name2);
            return compareValue;
        });
	}
}