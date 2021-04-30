import { Component, Input, SimpleChanges } from '@angular/core';
import { TreeOptionDefaults, TreeOptions } from 'src/app/models/tree-options.model';

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
    template: '<tree-root [id]="treeId" [nodes]="nodes" [options]="configOptions"></tree-root>'
})

export class TaxonomyTreeComponent {

    configOptions: TreeOptions = {};

    @Input() treeId: string = 'taxonomyTree';
    @Input() nodes: any[];
    @Input() options: TreeOptions = {};
    
    constructor() { 

        this.configOptions = {
            ...TreeOptionDefaults,
            ...this.options,
        };
    }

    ngOnChanges(changes: SimpleChanges) {

        for (const propertyName in changes) {

            if (propertyName === 'options') {

                this.configOptions = {
                    ...TreeOptionDefaults,
                    ...this.options,
                };
            }
        }
    }
}