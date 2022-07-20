import {NgModule} from '@angular/core';
import {CommonModule} from '@angular/common';
import {MatButtonModule} from '@angular/material/button';
import {NgbModule} from '@ng-bootstrap/ng-bootstrap';
import {MatFormFieldModule} from '@angular/material/form-field';
import {MatInputModule} from '@angular/material/input';
import {MatIconModule} from '@angular/material/icon';
import {MatMenuModule} from '@angular/material/menu';
import {DragAndDropDirective} from './drag-and-drop.directive';


@NgModule({
    declarations: [
        DragAndDropDirective
    ],
    imports: [
        CommonModule,
        MatButtonModule,
        MatFormFieldModule,
        MatInputModule,
        MatIconModule,
        MatMenuModule,
        NgbModule,
    ],
    exports: [DragAndDropDirective]
})
export class DirectivesModule {
}
