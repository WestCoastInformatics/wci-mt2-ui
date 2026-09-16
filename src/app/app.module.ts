// FRAMEWORK IMPORTS
import { BrowserModule } from '@angular/platform-browser';
import { CUSTOM_ELEMENTS_SCHEMA, NgModule, NO_ERRORS_SCHEMA } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { HTTP_INTERCEPTORS, provideHttpClient, withInterceptorsFromDi } from '@angular/common/http';
import { BrowserAnimationsModule } from '@angular/platform-browser/animations';
import { MatTableModule } from '@angular/material/table';
import { MatChipsModule } from '@angular/material/chips';
import { MatPaginatorModule } from '@angular/material/paginator';
import { MatSortModule } from '@angular/material/sort';
import { MatExpansionModule } from '@angular/material/expansion';
import { MatInputModule } from '@angular/material/input';
import { MatCheckboxModule } from '@angular/material/checkbox';
import { MatStepperModule } from '@angular/material/stepper';
import { MatMenuModule } from '@angular/material/menu';
import { MatSlideToggleModule } from '@angular/material/slide-toggle';
import { MatSelectModule } from '@angular/material/select';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { MatBadgeModule } from '@angular/material/badge';
import { MatButtonToggleModule } from '@angular/material/button-toggle';
import { DragDropModule } from '@angular/cdk/drag-drop';
import { RouteReuseStrategy, RouterModule, Routes } from '@angular/router';
import { AppComponent } from 'src/app/app.component';
import { BackendInterceptor } from 'src/app/interceptors/backend.interceptor';
import { HeaderInterceptor } from 'src/app/interceptors/header.interceptor';
import { SafeUrlPipe } from 'src/app/pipes/safe-urls.pipe';
import { NgbModule, NgbTypeaheadModule } from '@ng-bootstrap/ng-bootstrap';
import { TreeModule } from '@ali-hm/angular-tree-component';
import { EditorModule, TINYMCE_SCRIPT_SRC } from '@tinymce/tinymce-angular';
import { ToastNoAnimationModule } from 'ngx-toastr';
import { CustomReuseStrategy } from './custom-route-reuse-strategy';
import { AgGridModule } from 'ag-grid-angular';
import { AllCommunityModule, ModuleRegistry, provideGlobalGridOptions } from 'ag-grid-community';

// MODULE IMPORTS
import { DialogModule } from 'src/app/dialog/dialog.module';
import { MatRadioModule } from '@angular/material/radio';
import { AngularSplitModule } from 'angular-split';

// COMPONENT IMPORTS
import { NavbarComponent } from 'src/app/components/navbar/navbar.component';
import { FooterComponent } from 'src/app/components/footer/footer.component';
import { TemplateRendererComponent } from 'src/app/components/cellRenderers/template.renderer';
import { ColumnChooserComponent } from 'src/app/components/column-chooser/column-chooser.component';
import { NotificationComponent } from 'src/app/components/notification/notification.component';
import { DateTextFilterComponent } from 'src/app/components/dateTextFilter/date-text-filter.component';
import { CategoryFilterComponent } from 'src/app/components/categoryFilter/category-filter.component';
import { GridHeaderFilterComponent } from 'src/app/components/grid-header-filter/grid-header-filter.component';
import { PageContainerComponent } from 'src/app/components/page-container/page-container.component';
import { WorkflowStatusBadgeComponent } from './components/workflow-status-badge/workflow-status-badge.component';
import { NotesModalComponent } from './components/notes-modal/notes-modal.component';
import { WorkflowStatusComponent } from './components/workflow-status/workflow-status.component';

// PAGE IMPORTS
import { MapsetRecordsComponent } from './pages/mapset-records/mapset-records.component';
import { MapsetInactivesComponent } from './pages/mapset-inactives/mapset-inactives.component';
import { MapsetLibraryComponent } from './pages/mapset-library/mapset-library.component';
import { MapsetProjectsComponent } from './pages/mapset-projects/mapset-projects.component';
import { MapsetMappingComponent } from './pages/mapset-mapping/mapset-mapping.component';
import { EditMappingComponent } from './pages/edit-mapping/edit-mapping.component';
import { BatchMappingComponent } from './pages/batch-mapping/batch-mapping.component';
import { DashboardComponent } from './pages/dashboard/dashboard.component';
import { InboxComponent } from './pages/inbox/inbox.component';

// SERVICE IMPORTS
import { AuthenticationService } from 'src/app/services/authentication/authentication.service';
import { RestService } from 'src/app/services/rest/rest.service';
import { RefsetService } from 'src/app/services/rest/refset.service';
import { MT2Service } from 'src/app/services/mt2.service';
import { PaginationService } from 'src/app/services/pagination.service';
import { BreadcrumbService } from 'src/app/services/breadcrumb.service';
import { RouterExtentionService } from 'src/app/services/routerExtention.service';
import { NotificationService } from 'src/app/services/notification.service';
import { ErrorHandlingService } from 'src/app/services/error-handling.service';

// PROVIDER IMPORTS
import { EnvServiceProvider } from 'src/app/providers/env.service.provider';
import { ReadonlyTextModalComponent } from 'src/app/components/readonly-text-modal/readonly-text-modal.component';
import { AuthGuardGuard } from 'src/app/services/authentication/auth-guard.guard';
import { LoginComponent } from 'src/app/auth/login/login.component';
import { WorkflowMapModalComponent } from 'src/app/components/workflow-map-modal/workflow-map-modal.component';
import { DomService } from './services/dom.service';
import { PaginationModule } from './components/pagination/pagination.module';
import { DirectivesModule } from './directives/directives.module';
import { MapsetMetaTableComponent } from './components/mapset-meta-table/mapset-meta-table.component';
import { LandingComponent } from './pages/landing/landing-page.component';
import { ConflictComponent } from './pages/conflict/conflict.component';
import { MatNativeDateModule } from '@angular/material/core';
import { MatDatepickerModule } from '@angular/material/datepicker';

// Mark all grids as using legacy themes
provideGlobalGridOptions({
	theme: 'legacy',
});

ModuleRegistry.registerModules([AllCommunityModule]);

const appRoutes: Routes = [
	// { path: '', pathMatch: 'full', redirectTo: '' },
	{ path: 'login', component: LoginComponent },
	{ path: '', component: LandingComponent },
	{ path: 'conflict', component: ConflictComponent }, //demo only
	{ path: 'library', component: MapsetLibraryComponent, data: { breadcrumbLabel: 'Map Set Library' }, canActivate: [AuthGuardGuard] },
	{ path: 'projects', component: MapsetProjectsComponent, data: { breadcrumbLabel: 'Map Set Projects' }, canActivate: [AuthGuardGuard] },
	{
		path: 'library/mapset/:code/mappings',
		component: MapsetRecordsComponent,
		data: { breadcrumbLabel: 'Library Mappings' },
		canActivate: [AuthGuardGuard],
	},
	{
		path: 'projects/mapset/:code/mappings',
		component: MapsetRecordsComponent,
		data: { breadcrumbLabel: 'Projects Mappings' },
		canActivate: [AuthGuardGuard],
	},
	{
		path: 'projects/mapset/:code/mappings/inactives',
		component: MapsetInactivesComponent,
		data: { breadcrumbLabel: 'Manage Inactivated Concepts' },
		canActivate: [AuthGuardGuard],
	},
	{
		path: 'library/mapset/:code/mapping/:concept',
		component: MapsetMappingComponent,
		data: { breadcrumbLabel: 'Mapping' },
		canActivate: [AuthGuardGuard],
	},
	{
		path: 'projects/mapset/:code/mapping/:concept',
		component: MapsetMappingComponent,
		data: { breadcrumbLabel: 'Mapping' },
		canActivate: [AuthGuardGuard],
	},
	{
		path: 'projects/mapset/:code/mappings/:concepts/batch',
		component: BatchMappingComponent,
		data: { breadcrumbLabel: 'Batch Edit Mappings' },
		canActivate: [AuthGuardGuard],
		canDeactivate: [AuthGuardGuard],
		runGuardsAndResolvers: 'always',
	},
	{
		path: 'projects/mapset/:code/mapping/:concept/edit',
		component: EditMappingComponent,
		data: { breadcrumbLabel: 'Edit Map' },
		canActivate: [AuthGuardGuard],
		canDeactivate: [AuthGuardGuard],
		runGuardsAndResolvers: 'always',
	},
	{ path: 'dashboard', component: DashboardComponent, data: { breadcrumbLabel: 'Dashboard' }, canActivate: [AuthGuardGuard] },
	{ path: 'inbox', component: InboxComponent, data: { breadcrumbLabel: 'Inbox' }, canActivate: [AuthGuardGuard] },
	{
		path: '**',
		component: LandingComponent,
	},
];

@NgModule({
	declarations: [
		AppComponent,
		NavbarComponent,
		FooterComponent,
		TemplateRendererComponent,
		ColumnChooserComponent,
		NotificationComponent,
		SafeUrlPipe,
		CategoryFilterComponent,
		DateTextFilterComponent,
		GridHeaderFilterComponent,
		ReadonlyTextModalComponent,
		WorkflowMapModalComponent,
		LoginComponent,
		LandingComponent,
		DashboardComponent,
		InboxComponent,
		MapsetLibraryComponent,
		MapsetProjectsComponent,
		MapsetRecordsComponent,
		MapsetInactivesComponent,
		MapsetMappingComponent,
		EditMappingComponent,
		BatchMappingComponent,
		PageContainerComponent,
		WorkflowStatusBadgeComponent,
		NotesModalComponent,
		MapsetMetaTableComponent,
		WorkflowStatusComponent,
	],
	bootstrap: [AppComponent],
	schemas: [CUSTOM_ELEMENTS_SCHEMA, NO_ERRORS_SCHEMA],
	exports: [RouterModule],
	imports: [
		RouterModule.forRoot(
			appRoutes,
			{
				scrollPositionRestoration: 'top',
				canceledNavigationResolution: 'computed',
			},
			//{ enableTracing: true } // <-- debugging purposes only
		),
		BrowserModule,
		FormsModule,
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
		MatBadgeModule,
		MatButtonToggleModule,
		MatDatepickerModule,
		MatNativeDateModule,
		MatMenuModule,
		MatIconModule,
		MatRadioModule,
		DragDropModule,
		ToastNoAnimationModule.forRoot({
			toastComponent: NotificationComponent,
		}),
		DialogModule,
		TreeModule,
		AgGridModule,
		EditorModule,
		AngularSplitModule,
		NgbModule,
		ReactiveFormsModule,
		MatSlideToggleModule,
		CommonModule,
		PaginationModule,
		DirectivesModule,
	],
	providers: [
		AuthenticationService,
		EnvServiceProvider,
		RestService,
		RefsetService,
		MT2Service,
		PaginationService,
		BreadcrumbService,
		RouterExtentionService,
		NotificationService,
		ErrorHandlingService,
		DomService,
		{ provide: TINYMCE_SCRIPT_SRC, useValue: 'tinymce/tinymce.min.js' },
		{
			provide: HTTP_INTERCEPTORS,
			useClass: HeaderInterceptor,
			multi: true,
		},
		{
			provide: HTTP_INTERCEPTORS,
			useClass: BackendInterceptor,
			multi: true,
		},
		{ provide: RouteReuseStrategy, useClass: CustomReuseStrategy },
		provideHttpClient(withInterceptorsFromDi()),
	],
})
export class AppModule {}
