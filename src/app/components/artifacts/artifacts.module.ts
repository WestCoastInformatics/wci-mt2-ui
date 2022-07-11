import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ArtifactsModalComponent } from './artifacts-modal/artifacts-modal.component';
import { AgGridModule } from 'ag-grid-angular';
import { TemplateRenderer } from '../cellRenderers/template.renderer';
import { CustomTooltipComponent } from '../custom-tooltip/custom-tooltip.component';
import { ArtifactsListComponent } from './artifacts-list/artifacts-list.component';
import { MatButtonModule } from '@angular/material/button';
import { NgbModule } from '@ng-bootstrap/ng-bootstrap';
import { ArtifactFormComponent } from './artifact-form/artifact-form.component';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatIconModule } from '@angular/material/icon';
import { MatMenuModule } from '@angular/material/menu';


@NgModule({
    declarations: [
        ArtifactsModalComponent, ArtifactsListComponent, ArtifactFormComponent
    ],
    imports: [
        CommonModule,
        AgGridModule.withComponents([TemplateRenderer, CustomTooltipComponent]),
        MatButtonModule,
        MatFormFieldModule,
        MatInputModule,
        MatIconModule,
        MatMenuModule,
        NgbModule
    ],
     exports: [ArtifactsModalComponent]
})
export class ArtifactsModule {
}
