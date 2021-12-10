// FRAMEWORK IMPORTS
import { BrowserModule } from '@angular/platform-browser';
import { CUSTOM_ELEMENTS_SCHEMA, NgModule } from '@angular/core';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { HttpClientModule } from '@angular/common/http';
import { BrowserAnimationsModule } from '@angular/platform-browser/animations';
import { HTTP_INTERCEPTORS } from '@angular/common/http';
import { MatTableModule } from '@angular/material/table';
import { MatChipsModule } from '@angular/material/chips';
import { MatPaginatorModule } from '@angular/material/paginator';
import { MatSortModule } from '@angular/material/sort';
import { MatExpansionModule } from '@angular/material/expansion';
import { MatInputModule } from '@angular/material/input';
import { MatCheckboxModule } from '@angular/material/checkbox';
import { MatStepperModule } from '@angular/material/stepper';
import { MatSlideToggleModule } from '@angular/material/slide-toggle';
import { MatSelectModule } from '@angular/material/select';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { MatButtonToggleModule } from '@angular/material/button-toggle';
import { RouterModule, Routes } from '@angular/router';
import { AppComponent } from 'src/app/app.component';
import { BackendInterceptor } from 'src/app/interceptors/backend.interceptor';
import { HeaderInterceptor } from 'src/app/interceptors/header.interceptor';
import { SafeUrlPipe } from 'src/app/pipes/safe-urls.pipe';
import { NgbTypeaheadModule, NgbModule } from '@ng-bootstrap/ng-bootstrap';
import { TreeModule } from '@circlon/angular-tree-component';
import { AgGridModule } from 'ag-grid-angular';
import { EditorModule, TINYMCE_SCRIPT_SRC } from '@tinymce/tinymce-angular';
import { ToastNoAnimationModule } from 'ngx-toastr';

// MODULE IMPORTS
import { DialogModule } from 'src/app/dialog/dialog.module';
import {MatRadioModule} from '@angular/material/radio';
import { AngularSplitModule } from 'angular-split';

// COMPONENT IMPORTS
import { NavbarComponent } from 'src/app/components/navbar/navbar.component';
import { FooterComponent } from 'src/app/components/footer/footer.component';
import { TaxonomyTreeComponent } from 'src/app/components/taxonomy-tree/taxonomy-tree.component';
import { TemplateRenderer } from 'src/app/components/cellRenderers/template.renderer';
import { PaginationComponent } from 'src/app/components/pagination/pagination.component';
import { RefsetDownloadComponent } from 'src/app/components/refsetDownload/refset-download.component';
import { ColumnChooserComponent } from 'src/app/components/column-chooser/column-chooser.component';
import { NotificationComponent } from 'src/app/components/notification/notification.component';
import { CategoryFilterComponent } from 'src/app/components/categoryFilter/category-filter.component';
import { CreateNewRefsetComponent } from './components/create-new-refset/create-new-refset.component';
import { ImportFromFileModalComponent } from './components/import-from-file-modal/import-from-file-modal.component';
import { ImportFromListModalComponent } from './components/import-from-list-modal/import-from-list-modal.component';

// PAGE IMPORTS
import { RefsetDirectory } from 'src/app/pages/refset-directory';
import { RefsetDetails } from 'src/app/pages/refset-details';
import { ProjectsRefsetComponent } from './pages/projects/projects-refset.component';

// SERVICE IMPORTS
import { AuthenticationService } from 'src/app/services/authentication/authentication.service';
import { AuthoringService } from 'src/app/services/authoring/authoring.service';
import { RestService } from 'src/app/services/rest/rest.service';
import { ConceptsService } from 'src/app/services/rest/concepts.service';
import { RefsetService } from 'src/app/services/rest/refset.service';
import { PaginationService } from 'src/app/services/pagination.service';
import { BreadcrumbService } from 'src/app/services/breadcrumb.service';
import { NotificationService } from 'src/app/services/notification.service';

// PROVIDER IMPORTS
import { EnvServiceProvider } from 'src/app/providers/env.service.provider';
import { SideBarModule } from './components/side-bar/side-bar.module';
import { dragAndDropDirective } from './directives/drag-and-drop.directive';
import { AddRemoveByConceptModalComponent } from './components/add-remove-by-concept-modal/add-remove-by-concept-modal.component';
import { ScrollTopComponent } from './components/scroll-top/scroll-top.component';
import { ReadonlyTextModalComponent } from './components/readonly-text-modal/readonly-text-modal.component';
import { ReadyForPublicationModalComponent } from './components/ready-for-publication-modal/ready-for-publication-modal.component';
import { WorkflowHistoryNotesModalComponent } from './components/workflow-history-notes-modal/workflow-history-notes-modal.component';
import { AddRemoveConceptsComponent } from './components/add-remove-concepts/add-remove-concepts.component';
import { AddRemoveConceptsIconsComponent } from './components/add-remove-concepts-icons/add-remove-concepts-icons.component';
import { AuthGuardGuard } from './services/authentication/auth-guard.guard';
import { LoginComponent } from './auth/login/login.component';
import { ReviewModalComponent } from './components/review-modal/review-modal.component';

const appRoutes: Routes = [
    { path: '', pathMatch: 'full', redirectTo: 'directory' },
    { path: 'login', component: LoginComponent },
    { path: 'directory', component: RefsetDirectory, data: { breadcrumbLabel: 'Directory' } },
    { path: 'details/:refsetId', component: RefsetDetails, data: { breadcrumbLabel: 'Refset Details', editMode: false } },
    { path: 'projects', component: ProjectsRefsetComponent, canActivate: [AuthGuardGuard] },
    { path: 'edit/refset/:refsetId', component: RefsetDetails, data: { breadcrumbLabel: 'Edit Reference Set', editMode: true }, canActivate: [AuthGuardGuard] },
];

@NgModule({
    declarations: [
        AppComponent,
        NavbarComponent,
        FooterComponent,
        TaxonomyTreeComponent,
        TemplateRenderer,
        PaginationComponent,
        RefsetDownloadComponent,
        ColumnChooserComponent,
        NotificationComponent,
        SafeUrlPipe,
        RefsetDirectory,
        RefsetDetails,
		CategoryFilterComponent,
		CreateNewRefsetComponent,
		ProjectsRefsetComponent,
        ImportFromFileModalComponent,
        ImportFromListModalComponent,
        dragAndDropDirective,
        AddRemoveByConceptModalComponent,
        ScrollTopComponent,
        ReadonlyTextModalComponent,
        ReadyForPublicationModalComponent,
        ReviewModalComponent,
        WorkflowHistoryNotesModalComponent,
        AddRemoveConceptsComponent,
        AddRemoveConceptsIconsComponent,
        LoginComponent
    ],
    imports: [
        RouterModule.forRoot(
            appRoutes,
            //{ enableTracing: true } // <-- debugging purposes only
        ),
        BrowserModule,
        FormsModule,
        HttpClientModule,
        BrowserAnimationsModule,
        NgbTypeaheadModule,
        MatTableModule,
        MatChipsModule,
        MatPaginatorModule,
        MatSortModule,
        MatExpansionModule,
        MatInputModule,
        MatCheckboxModule,
        MatSelectModule,
        MatFormFieldModule,
        MatStepperModule,
        MatButtonModule,
        MatButtonToggleModule,
        MatIconModule,
        MatRadioModule,
        ToastNoAnimationModule.forRoot({
            toastComponent: NotificationComponent
          }),
        DialogModule,
        TreeModule,
        AgGridModule.withComponents([TemplateRenderer]),
        EditorModule,
        AngularSplitModule,
        NgbModule,
        SideBarModule,
        ReactiveFormsModule,
        MatSlideToggleModule
    ],
    entryComponents: [NotificationComponent],
    providers: [
        AuthenticationService,
        AuthoringService,
        EnvServiceProvider,
        RestService,
        ConceptsService,
        RefsetService,
		RefsetDetails,
        PaginationService,
        BreadcrumbService,
        NotificationService,
        { provide: TINYMCE_SCRIPT_SRC, useValue: 'tinymce/tinymce.min.js' },
        {
            provide: HTTP_INTERCEPTORS,
            useClass: HeaderInterceptor,
            multi: true
        },
        {
            provide: HTTP_INTERCEPTORS,
            useClass: BackendInterceptor,
            multi: true
        }
    ],
    bootstrap: [AppComponent],
    schemas: [ CUSTOM_ELEMENTS_SCHEMA ]
})
export class AppModule {
}
