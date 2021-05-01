export interface TreeOptions {
    idField?: string;
    isExpandedField?: boolean;
    allowDrop?: boolean;
    nodeClass?: Function;
    childrenField?: string;
    hasChildrenField?: string;
    getChildren?: Function;
    onSelect?: Function;
}

export const TreeOptionDefaults: TreeOptions = {
    idField: 'code',
    isExpandedField: false,
    allowDrop: false,
    childrenField: 'children',
    hasChildrenField: 'hasChildren',
    getChildren: null,
    onSelect: function(event){}
}