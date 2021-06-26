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
    loadNodeChildrenProcess: Function = (event) => {};
    refsetUtility = RefsetUtility;

    @Input() treeId: string = 'taxonomyTree';
    @Input() refset: any;
    @Input() rootNode: any;
    @Input() options: TreeOptions = {};
    @Input() manualStateRefresh = false;
    @Input() hasMultipleRootNodes: boolean = false;

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

            if (propertyName === 'options' || propertyName === 'manualStateRefresh') {

                this.configOptions = {
                    ...this.staticOptions,
                    ...TreeOptionDefaults,
                    ...this.options,
                    getChildren: this.getChildren.bind(this)
                };

                if (this.hasMultipleRootNodes) {
                    this.configOptions.expandFirstNode = false;
                }

                if (CodeUtility.hasValue(this.nodes)) {

                    let treeModel: TreeModel = this.treeComponent.treeModel;
                    this.sortTree(treeModel.nodes);
                }

                this.changeDetectorRef.detectChanges();

            } else if (propertyName === 'rootNode' && CodeUtility.hasValue(this.rootNode)) {

                // if there should be children and aren't, or the children don't have descriptions - then fetch all the info for the children
                if (this.rootNode.hasChildren
                    && (!CodeUtility.hasValue(this.rootNode.children) || !CodeUtility.hasValue(this.rootNode.children[0].descriptions))) {

                    let depth: number = 1

                    let restParams = {
                        displayType: 'taxonomy',
                        depth: depth,
                        startingConceptId: this.rootNode.code,
                        offset: 0,
                        limit: 1000
                    };

                    this.refsetService.getMembersList(this.refset.id, restParams).subscribe(results => {
                        this.prepareData(results.items);
                    });

                } else {
                    this.prepareData(this.rootNode.children);
                }
            }
        }
    }

    prepareData(data) {

        RefsetUtility.setEmptyChildrenNull(data);

        if (this.hasMultipleRootNodes) {

            this.rootNode = data;
            this.sortNodes(this.rootNode);
            this.sortTree(this.rootNode);
            this.nodes = this.rootNode;
        } else {

            this.rootNode.children = data;
            this.sortTree([this.rootNode]);
            this.nodes = [this.rootNode];
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
        this.sortTree([{ children: data }]);
        return data;
    }

    styleNodeClass(node: TreeNode) {

        let classes = '';

        if (CodeUtility.testBoolean(node.data.hasDescendantRefsetMembers)) {
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

    getNodeText(node) {

        let text = '';
        let index = this.options.displayField;
        let data = node.data;

        if (!CodeUtility.hasValue(data)) {
            data = node;
        }

        let choosenDescription = data.descriptions[index];

        if (choosenDescription != null) {
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

    onLoadNodeChildren(event) {
        this.loadNodeChildrenProcess(event);
    }

    getNodeIDByConceptID(conceptID) {

        return this.treeComponent.treeModel.getNodeBy((node) => {
            
            let data = node.data;

            if (!CodeUtility.hasValue(data)) {
                data = node;
            }

            return data.code == conceptID;
        });
    }

    /*
    * findNodeInTree - find the target node in the tree, populating its lineage path if it is not currently in the tree
    * @param conceptID - the concept ID for the target node
    * @param parentPath - an array of the parents concepts of the target concept starting at the root of the tree. If not supplied tree will look parents up.
    * @param returnFunction - a callback function that takes as a parameter the tree node ID of the target node. Because findNodeInTree may be making ajax calls it can't return the ID normally
    * @param selectTheNode - should the target node be selected once it is found (default true)
    * @param suppressChangeEvent - should the tree onchange event be fired if the target node is selected (default true)
    */
    findNodeInTree(conceptID, parentPath: any[] = [], returnFunction: Function = function(){}, selectTheNode = true, suppressChangeEvent = true) {

        let deferred;

        let startFind = () => {

            // create a deferred object so that we can make sure only one query gets processed at a time
            deferred = $.Deferred();

            // create a deferred object so that when the node is found we can return the node ID to the calling function
            let deferredReturn = $.Deferred();

            // an array of callback functions to handle cleanup of each node we touch once we find the target node
            let cleanUpNodes = [];

            // get the ID of the node in the tree from the concept ID
            let node = this.getNodeIDByConceptID(conceptID);

            // if the node exists in the tree continue on
            if (node == undefined){

                let processNodeParents = (parentArray) => {

                    if (parentArray.length > 0){

                        // this is a recursive function that will process each of the returned nodes, starting with the root, and walk down to the target node
                        let walkTree = (index) => {

                            // find this node in the tree
                            let nodeInTree = this.getNodeIDByConceptID(parentArray[index].code);

                            if (nodeInTree) {

                                // store the open/close state of the node in the tree
                                let isAlreadyOpen = nodeInTree.isExpanded;

                                // add a function to our callback array to handle cleanup of this node once the target node is found
                                cleanUpNodes.push(function () {

                                    // if the node was closed and we are not selecting the target node, re-close this node
                                    if (!selectTheNode && !isAlreadyOpen) {
                                        nodeInTree.collapse();
                                    }
                                });

                                let processNodeChildren = () => {

                                    // if we are not at the last element of the parent array
                                    if (index < parentArray.length - 1){

                                        // call this the walkTree function again with the index for the next child node
                                        walkTree(index + 1);

                                    } else {

                                        this.loadNodeChildrenProcess = (event) => {};

                                        // since the node has no children it is the parent of our target node, so the target node should now exist in the tree.
                                        // get the target node by its concept ID
                                        node = this.getNodeIDByConceptID(conceptID);

                                        // resolve our deferred call with the target node
                                        deferredReturn.resolve(node);

                                        // back down our callback array to clean up all the nodes that were touched
                                        while (cleanUpNodes.length > 0){
                                            cleanUpNodes.pop().call();
                                        }
                                    }
                                };

                                // open this node in the tree so we get all of its children
                                this.loadNodeChildrenProcess = (event) => {processNodeChildren()};
                                
                                if (isAlreadyOpen) {
                                    processNodeChildren();
                                } else {
                                    nodeInTree.expand();
                                }
                                
                            }
                        };

                        // call the recursive function with the index for the root node
                        walkTree(0);
                    }
                };

                if (parentPath.length > 0) { 
                    processNodeParents(parentPath);

                } else {

                    // make a call to get all the parents of the target node back to the root
                    //$.get(gon.routes.taxonomy_load_tree_data_path + params, processNodeParents);
                }

            } else{

                // the node was already in the tree so resolve our deferred call with its tree ID
                deferredReturn.resolve(node);
            }

            // what to do once our target node has been found
            $.when(deferredReturn).done((data) => {

                // if the node was found and we are selecting the target
                if (data != undefined && selectTheNode){

                    // select the target node without firing the change event and set the concept ID as the current ID on the tree
                    this.selectNode(node, suppressChangeEvent);
                }

                deferred.resolve();

                // put the target node ID into the return callback so the calling function has access to it
                returnFunction(data);
            });
        };

        // make sure only one find operation is run at a time
        if (deferred && deferred.state() == "pending"){
            deferred.done(startFind);
        } else {
            startFind();
        }
    }

    selectNode(node, suppressChangeEvent) {

        node.ensureVisible();
        

        if (suppressChangeEvent) {
            node.focus();
        } else {
            node.setIsActive(true);
        }

        let element: any = $('#' + node.parent.data.code + '-' + node.data.code);
        element[0].scrollIntoView({behavior: 'smooth'});
    }
}