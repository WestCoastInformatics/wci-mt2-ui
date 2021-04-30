export interface TreeOptions {
    idField?: string;
    isExpandedField?: boolean;
    allowDrop?: boolean;
    nodeClass?: string;
    childrenField?: string;
    hasChildrenField?: string;
    getChildren?: Function;
}

export const TreeOptionDefaults: TreeOptions = {
    idField: 'code',
    isExpandedField: false,
    allowDrop: false,
    nodeClass: '',
    childrenField: 'children',
    hasChildrenField: 'hasChildren',
    getChildren: null,
}