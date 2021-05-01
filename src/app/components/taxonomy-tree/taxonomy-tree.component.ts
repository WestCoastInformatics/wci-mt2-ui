import { Component, Input, SimpleChanges } from '@angular/core';
import { TreeNode } from '@circlon/angular-tree-component';
import { TreeOptionDefaults, TreeOptions } from 'src/app/models/tree-options.model';
import { CodeUtility } from 'src/app/utilities/code.utility';

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
    template: '<tree-root [id]="treeId" class="refset-tool-taxonomy" [nodes]="nodes" [options]="configOptions" (activate)="configOptions.onSelect($event)"></tree-root>'
})

export class TaxonomyTreeComponent {

    configOptions: TreeOptions = {};
    staticOptions: any = {nodeClass: this.styleNodeClass};

    @Input() treeId: string = 'taxonomyTree';
    @Input() nodes: any[];
    @Input() options: TreeOptions = {};
    
    constructor() { 

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
            }
        }
    }

    styleNodeClass(node: TreeNode) {

        let classes = '';

        if (CodeUtility.testBoolean(node.data.hasChildrenRefsetMembers)) {
            classes += ' refset-tool-taxonomy-relation-members';
        }

        if (CodeUtility.testBoolean(node.data.memberOfRefset)) {
            classes += ' refset-tool-taxonomy-is-member';
        }

        return classes;
      }

}