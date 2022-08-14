import {
    ChangeDetectorRef,
    Component,
    EventEmitter,
    Input,
    Output,
    SimpleChanges,
    ViewChild,
} from "@angular/core";
import {
    TreeComponent,
    TreeModel,
    TreeNode,
} from "@circlon/angular-tree-component";
import { NgbModal } from "@ng-bootstrap/ng-bootstrap";
import { lastValueFrom, Observable } from "rxjs";
import {
    TreeOptionDefaults,
    TreeOptions,
} from "src/app/models/tree-options.model";
import { RefsetService } from "src/app/services/rest/refset.service";
import { CodeUtility } from "src/app/utilities/code.utility";
import { RefsetUtility } from "src/app/utilities/refset.utility";

/**
 * Taxonomy data with nested structure.
 * Each node has a name and an optional list of children.
 */

/**
 * @title Tree with nested nodes
 */
@Component({
    selector: "app-taxonomy-tree",
    templateUrl: "taxonomy-tree.component.html",
})
export class TaxonomyTreeComponent {

    configOptions: TreeOptions = {};
    staticOptions: any = { nodeClass: this.styleNodeClass };
    nodes: any[] = [];
    parentConcept: any;
    loadNodeChildrenProcess: any;
    refsetUtility = RefsetUtility;
    isLoading = false;
    noData = false;
    showLoadingSpinner = false;
    loadedChildren: any;
    isAdd: boolean;
    conceptForAddRemove: any;
    addRemoveDefinitionExceptionType: string;

    @Input() editMode = false;
    @Input() isOnDetailsPage = true;
    @Input() isParentConcept = false;
    @Input() treeId = "taxonomyTree";
    @Input() refset: any;
    @Input() rootNode: any;
    @Input() options: TreeOptions = {};
    @Input() manualStateRefresh = false;
    @Input() hasMultipleRootNodes = false;
    @Input() selectedConcept: any;
    @Input() processChangedMemberFunction: () => void;
    @Output() changeLockedStatus = new EventEmitter<any>(true);
    @Output() loadConceptDetail = new EventEmitter<any>();
    @Output() numOfChildren = new EventEmitter<any>();

    @ViewChild(TreeComponent) treeComponent: TreeComponent;

    constructor(
        private changeDetectorRef: ChangeDetectorRef,
        private refsetService: RefsetService,
        private readonly modalService: NgbModal
    ) {
        this.configOptions = {
            ...this.staticOptions,
            ...TreeOptionDefaults,
            ...this.options,
            getChildren: this.getChildren.bind(this),
        };
    }

    ngOnChanges(changes: SimpleChanges) {

        for (const propertyName in changes) {

            if (propertyName === "options") {

                this.configOptions = {
                    ...this.staticOptions,
                    ...TreeOptionDefaults,
                    ...this.options,
                    getChildren: this.getChildren.bind(this),
                };

                if (this.hasMultipleRootNodes) {
                    this.configOptions.expandFirstNode = false;
                }

                if (CodeUtility.hasValue(this.nodes)) {

                    const treeModel = this.treeComponent?.treeModel;

                    if (CodeUtility.hasValue(treeModel)) {
                        this.sortTree(treeModel.nodes);
                    }
                }

                this.changeDetectorRef.detectChanges();

            } else if (propertyName === "rootNode" && CodeUtility.hasValue(this.rootNode)) {

                if (!this.rootNode.active) {

                    this.isLoading = false;
                    this.showLoadingSpinner = false;
                    this.noData = true;
                    return;
                }

                this.parentConcept = this.rootNode;

                // if there should be children and aren't, or the children don't have descriptions - then fetch all the info for the children
                if (!CodeUtility.hasValue(this.rootNode.children) || !CodeUtility.hasValue(this.rootNode.children[0].name)) {

                    this.getTreeData();
                } else {

                    this.isLoading = true;
                    this.showLoadingSpinner = true;
                    this.prepareData(this.rootNode.children);
                }

            } else if (propertyName === "manualStateRefresh") {

                this.isLoading = true;
                this.showLoadingSpinner = true;
                this.nodes = [];
            }
        }
    }

    getTreeData() {

        this.isLoading = true;
        this.showLoadingSpinner = true;
        const restParams = {
            displayType: "taxonomy",
            depth: 1,
            startingConceptId: this.rootNode.code,
            language: this.options.language,
            offset: 0,
            limit: 1000,
        };

        this.refsetService.getConceptList(this.refset.id, restParams).subscribe({
            next: (results) => {

                this.prepareData(results.items);
                this.sendnumOfChildrenTrigger(results?.items?.length);
                console.log(results.items);
            },
            error: (error) => {

                this.isLoading = false;
                this.showLoadingSpinner = false;
                this.showLoadingSpinner = false;
            }
        });
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

        if (CodeUtility.hasValue(data)) {
            this.noData = false;
        } else {
            this.noData = true;
        }

        this.isLoading = false;
        this.showLoadingSpinner = false;
    }

    onInitTree(event) {
        if (!CodeUtility.hasValue(this.nodes)) {
            return;
        }

        if (this.configOptions.expandFirstNode) {
            const treeModel = this.treeComponent.treeModel;
            const firstNode = treeModel.getFirstRoot();
            firstNode.expand();
        }
    }

    async getChildren(node: any) {

        const restParams = {
            displayType: "taxonomy",
            depth: 1,
            startingConceptId: node.data?.code ? node.data?.code : node?.code,
            language: this.options.language,
            offset: 0,
            limit: 1000,
        };

        // need to return a promise or the data to the tree, not an observable
        const results$: Observable<any> = this.refsetService.getConceptList(this.refset.id, restParams);
        const resultData: any = await lastValueFrom(results$);
        const data = resultData.items;
        RefsetUtility.setEmptyChildrenNull(data);
        this.sortTree([{ children: data }]);
        return data;
    }

    // showSpinner(): void {
    //     this.showLoadingSpinner = true;
    //     setTimeout(() => {
    //         this.showLoadingSpinner = false;
    //     }, 2000);
    // }

    styleNodeClass(node: TreeNode) {
        let classes = "";

        if (CodeUtility.testBoolean(node.data.hasDescendantRefsetMembers)) {
            classes += " refset-tool-taxonomy-relation-members";
        }

        if (CodeUtility.testBoolean(node.data.memberOfRefset)) {
            classes += " refset-tool-taxonomy-is-member";
        } else {
            if (CodeUtility.testBoolean(node.data.hasChildrenRefsetMembers)) {
                classes += " refset-tool-taxonomy-is-not-member";
            } else {
                classes += " refset-tool-taxonomy-no-members-in-branch";
            }
        }

        return classes;
    }

    getNodeAddIconMargin(node: TreeNode) {
        const marginSize = (node.level - 1) * 20;
        return `margin-left: ${marginSize}px;display: inline-flex;width: calc(100% - 23px - ${marginSize}px);align-items: baseline;`;
    }

    getNodeText(node) {
        let text = "";
        let data = node?.data;

        if (!CodeUtility.hasValue(data)) {
            data = node;
        }

        const useFsn = this.options?.useFsn;

        if (useFsn && CodeUtility.hasValue(data.fsn)) {
            text = data.fsn;
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
            const name1 = this.getNodeText(node1);
            const name2 = this.getNodeText(node2);

            const compareValue = name1.localeCompare(name2);
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
    findNodeInTree(conceptID, parentPath: any[] = [], returnFunction: any, selectTheNode = true, suppressChangeEvent = true) {

        let deferred;

        const startFind = () => {
            // create a deferred object so that we can make sure only one query gets processed at a time
            deferred = $.Deferred();

            // create a deferred object so that when the node is found we can return the node ID to the calling function
            const deferredReturn = $.Deferred();

            // an array of callback functions to handle cleanup of each node we touch once we find the target node
            const cleanUpNodes = [];

            // get the ID of the node in the tree from the concept ID
            let node = this.getNodeIDByConceptID(conceptID);

            // if the node exists in the tree continue on
            if (node == undefined) {

                const processNodeParents = (parentArray) => {

                    if (parentArray.length > 0) {

                        // this is a recursive function that will process each of the returned nodes, starting with the root, and walk down to the target node
                        const walkTree = (index) => {

                            // find this node in the tree
                            const nodeInTree = this.getNodeIDByConceptID(
                                parentArray[index].code
                            );

                            if (nodeInTree) {

                                // store the open/close state of the node in the tree
                                const isAlreadyOpen = nodeInTree.isExpanded;

                                // add a function to our callback array to handle cleanup of this node once the target node is found
                                cleanUpNodes.push(function () {

                                    // if the node was closed and we are not selecting the target node, re-close this node
                                    if (!selectTheNode && !isAlreadyOpen) {
                                        nodeInTree.collapse();
                                    }
                                });

                                const processNodeChildren = () => {

                                    // if we are not at the last element of the parent array
                                    if (index < parentArray.length - 1) {

                                        // call this the walkTree function again with the index for the next child node
                                        walkTree(index + 1);
                                    } else {

                                        this.loadNodeChildrenProcess = (
                                            event
                                        ) => { };

                                        // since the node has no children it is the parent of our target node, so the target node should now exist in the tree.
                                        // get the target node by its concept ID
                                        node =
                                            this.getNodeIDByConceptID(
                                                conceptID
                                            );

                                        // resolve our deferred call with the target node
                                        deferredReturn.resolve(node);

                                        // back down our callback array to clean up all the nodes that were touched
                                        while (cleanUpNodes.length > 0) {
                                            cleanUpNodes.pop().call();
                                        }
                                    }
                                };

                                // open this node in the tree so we get all of its children
                                this.loadNodeChildrenProcess = (event) => {
                                    processNodeChildren();
                                };

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
            } else {

                // the node was already in the tree so resolve our deferred call with its tree ID
                deferredReturn.resolve(node);
            }

            // what to do once our target node has been found
            $.when(deferredReturn).done((data) => {

                // if the node was found and we are selecting the target
                if (data != undefined && selectTheNode) {

                    // select the target node without firing the change event and set the concept ID as the current ID on the tree
                    this.selectNode(node, suppressChangeEvent);
                }

                deferred.resolve();

                // put the target node ID into the return callback so the calling function has access to it
                returnFunction(data);
            });
        };

        // make sure only one find operation is run at a time
        if (deferred && deferred.state() == "pending") {
            deferred.done(startFind);
        } else {
            startFind();
        }
    }

    sendChangeLockedStatus = (value: any) => {
        this.changeLockedStatus.emit(value);
    }

    sendConceptDetailTrigger(value: any): void {
        this.loadConceptDetail.emit(value);
    }

    private sendnumOfChildrenTrigger(value: any): void {
        this.numOfChildren.emit(value);
    }

    addRemoveConcept(params: any): void {

        this.isAdd = new Boolean(params.addConcept) as boolean;
        this.conceptForAddRemove = params.concept;
        this.addRemoveDefinitionExceptionType = params.definitionExceptionType;
    }

    selectNode(node, suppressChangeEvent) {
        node.ensureVisible();

        if (suppressChangeEvent) {
            node.focus();
        } else {
            node.setIsActive(true);
        }

        const element: any = $(
            "#" + node.parent.data.code + "-" + node.data.code
        );
        element[0].scrollIntoView({ behavior: "smooth" });
    }
}
