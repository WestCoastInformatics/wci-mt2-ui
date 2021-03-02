import { Component } from '@angular/core';

/**
 * Taxonomy data with nested structure.
 * Each node has a name and an optional list of children.
 */
interface ConceptNode {
    id: string;
    name: string;
    children?: ConceptNode[];
}

const TREE_DATA: ConceptNode[] = [
    {
        id: '138875005',
        name: 'SNOMED CT Concept (SNOMED RT+CTV3)',
        children: [
            { id: '123037004', name: 'Body structure (body structure)', children: [
                { id: '442083009', name: 'Anatomical or acquired body structure (body structure)' },
                { id: '278001007', name: 'Nonspecific site (body structure)' },
                { id: '87100004', name: 'Topography unknown (body structure)' }
            ]},
            { id: '404684003', name: 'Clinical finding (finding)' },
            { id: '272379006', name: 'Event (event)' },
        ]
    }
];

/**
 * @title Tree with nested nodes
 */
@Component({
    selector: 'app-taxonomy-tree',
    template: '<tree-root [nodes]="nodes" [options]="options"></tree-root>'
})

export class TaxonomyTreeComponent {

    nodes = TREE_DATA;
    options = [];

    constructor() { 
    }

    hasChild = (_: number, node: ConceptNode) => !!node.children && node.children.length > 0;
}