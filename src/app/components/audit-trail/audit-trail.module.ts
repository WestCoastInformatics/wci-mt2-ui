import {NgModule} from '@angular/core';
import {CommonModule} from '@angular/common';
import {AgGridModule} from 'ag-grid-angular';
import {TemplateRenderer} from '../cellRenderers/template.renderer';
import {CustomTooltipComponent} from '../custom-tooltip/custom-tooltip.component';
import {MatButtonModule} from '@angular/material/button';
import {NgbModule} from '@ng-bootstrap/ng-bootstrap';
import {MatFormFieldModule} from '@angular/material/form-field';
import {MatInputModule} from '@angular/material/input';
import {MatIconModule} from '@angular/material/icon';
import {MatMenuModule} from '@angular/material/menu';
import {AuditTrailModalComponent} from './audit-trail-modal/audit-trail-modal.component';
import {AuditTrailListComponent} from './audit-trail-list/audit-trail-list.component';
import {PaginationModule} from '../pagination/pagination.module';


@NgModule({
    declarations: [
        AuditTrailModalComponent, AuditTrailListComponent
    ],
    imports: [
        CommonModule,
        AgGridModule.withComponents([TemplateRenderer, CustomTooltipComponent]),
        MatButtonModule,
        MatFormFieldModule,
        MatInputModule,
        MatIconModule,
        MatMenuModule,
        NgbModule,
        PaginationModule
    ],
    exports: [AuditTrailModalComponent]
})
export class AuditTrailModule {
}
