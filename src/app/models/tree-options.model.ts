import { TreeNode } from '@circlon/angular-tree-component';

export interface TreeOptions {
    idField?: string;
    isExpandedField?: boolean;
    allowDrop?: boolean;
    nodeClass?: Function;
    childrenField?: string;
    hasChildrenField?: string;
    onSelect?: Function;
    displayField?: string;
    expandFirstNode?: boolean;
    hasMultipleRootNodes?: boolean;
    useVirtualScroll?: boolean;
    nodeHeight?: any;
}

export const TreeOptionDefaults: TreeOptions = {
    idField: 'code',
    isExpandedField: false,
    allowDrop: false,
    childrenField: 'children',
    hasChildrenField: 'hasChildren',
    displayField: 'name',
    expandFirstNode: true,
    hasMultipleRootNodes: false,
    onSelect: function(event){},
    useVirtualScroll: false,
    nodeHeight: 22
}