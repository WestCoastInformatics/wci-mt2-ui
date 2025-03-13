// FRAMEWORK IMPORTS
import { BrowserModule } from '@angular/platform-browser';
import { CUSTOM_ELEMENTS_SCHEMA, NgModule, NO_ERRORS_SCHEMA } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { HTTP_INTERCEPTORS, HttpClientModule } from '@angular/common/http';
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
import { TreeModule } from '@circlon/angular-tree-component';
import { AgGridModule } from 'ag-grid-angular';
import { EditorModule, TINYMCE_SCRIPT_SRC } from '@tinymce/tinymce-angular';
import { ToastNoAnimationModule } from 'ngx-toastr';
import { CustomReuseStrategy } from './custom-route-reuse-strategy';

// MODULE IMPORTS
import { DialogModule } from 'src/app/dialog/dialog.module';
import { MatRadioModule } from '@angular/material/radio';
import { AngularSplitModule } from 'angular-split';

// COMPONENT IMPORTS
import { SidebarComponent } from 'src/app/components/sidebar/sidebar.component';
import { NavbarComponent } from 'src/app/components/navbar/navbar.component';
import { FooterComponent } from 'src/app/components/footer/footer.component';
import { TaxonomyTreeComponent } from 'src/app/components/taxonomy-tree/taxonomy-tree.component';
import { TemplateRendererComponent } from 'src/app/components/cellRenderers/template.renderer';
import { RefsetDownloadComponent } from 'src/app/components/refsetDownload/refset-download.component';
import { ColumnChooserComponent } from 'src/app/components/column-chooser/column-chooser.component';
import { NotificationComponent } from 'src/app/components/notification/notification.component';
import { DateTextFilterComponent } from 'src/app/components/dateTextFilter/date-text-filter.component';
import { CategoryFilterComponent } from 'src/app/components/categoryFilter/category-filter.component';
import { GridHeaderFilterComponent } from 'src/app/components/grid-header-filter/grid-header-filter.component';
import { ImportFromFileModalComponent } from 'src/app/components/import-from-file-modal/import-from-file-modal.component';
import { ImportFromListModalComponent } from 'src/app/components/import-from-list-modal/import-from-list-modal.component';
import { BulkUpgradeModalComponent } from 'src/app/components/bulk-upgrade-modal/bulk-upgrade-modal.component';
import { HeadingWithCountComponent } from 'src/app/components/heading-with-count/heading-with-count.component';
import { PageContainerComponent } from 'src/app/components/page-container/page-container.component';
import { AddMemberToOrganizationModalComponent } from 'src/app/components/add-member-to-organization-modal/add-member-to-organization-modal.component';
import { AddMemberToTeamModalComponent } from 'src/app/components/add-member-to-team-modal/add-member-to-team-modal.component';
import { CreateNewProjectModalComponent } from 'src/app/components/create-new-project-modal/create-new-project-modal.component';
import { AddRemoveConceptsIconsComponent } from 'src/app/components/add-remove-concepts-icons/add-remove-concepts-icons.component';
import { AddRemoveConceptGroupIconsComponent } from 'src/app/components/add-remove-concepts-icons/add-remove-concept-group-icons.component';
import { WorkflowStatusBadgeComponent } from './components/workflow-status-badge/workflow-status-badge.component';
import { ArtifactsModule } from './components/artifacts/artifacts.module';
import { AuditTrailModule } from './components/audit-trail/audit-trail.module';

// PAGE IMPORTS
import { MapsetRecordsComponent } from './pages/mapset-records/mapset-records.component';
import { MapsetInactivesComponent } from './pages/mapset-inactives/mapset-inactives.component';
import { MapsetLibraryComponent } from './pages/mapset-library/mapset-library.component';
import { MapsetProjectsComponent } from './pages/mapset-projects/mapset-projects.component';
import { MapsetDetailsComponent } from './pages/mapset-details/mapset-details.component';
import { MapsetMappingComponent } from './pages/mapset-mapping/mapset-mapping.component';
import { EditMappingComponent } from './pages/edit-mapping/edit-mapping.component';
import { BatchMappingComponent } from './pages/batch-mapping/batch-mapping.component';
import { DashboardComponent } from './pages/dashboard/dashboard.component';
import { ProjectsRefsetComponent } from './pages/projects/refsets/projects-refset.component';
import { OrganizationsComponent } from './pages/organizations/organizations.component';
import { OrganizationProjectsComponent } from './pages/organizations/projects/projects.component';
import { OrganizationTeamsComponent } from './pages/organizations/teams/teams.component';
import { OrganizationPeopleComponent } from './pages/organizations/people/people.component';
import { OrganizationConfigurationComponent } from './pages/organizations/configuration/configuration.component';
import { ProjectsComponent } from './pages/projects/projects.component';
import { ProjectsPeopleComponent } from './pages/projects/people/people.component';
import { ProjectsTeamsComponent } from './pages/projects/teams/teams.component';
import { ProjectsConfigurationComponent } from './pages/projects/configuration/configuration.component';
import { TeamsComponent } from './pages/teams/teams.component';
import { TeamsPeopleComponent } from './pages/teams/people/people.component';
import { TeamsConfigurationComponent } from './pages/teams/configuration/configuration.component';
import { PersonalComponent } from './pages/personal/personal.component';
import { PersonalLandingComponent } from './pages/personal/landing/landing.component';
import { PersonalConfigurationComponent } from './pages/personal/configuration/configuration.component';

// SERVICE IMPORTS
import { AuthenticationService } from 'src/app/services/authentication/authentication.service';
import { RestService } from 'src/app/services/rest/rest.service';
import { ConceptsService } from 'src/app/services/rest/concepts.service';
import { RefsetService } from 'src/app/services/rest/refset.service';
import { MT2Service } from 'src/app/services/mt2.service';
import { PaginationService } from 'src/app/services/pagination.service';
import { BreadcrumbService } from 'src/app/services/breadcrumb.service';
import { RouterExtentionService } from 'src/app/services/routerExtention.service';
import { NotificationService } from 'src/app/services/notification.service';
import { ErrorHandlingService } from 'src/app/services/error-handling.service';
import { OrganizationsComponentService } from './pages/organizations/organizations-component.service';
import { ProjectsComponentService } from './pages/projects/projects-component.service';
import { TeamsComponentService } from './pages/teams/teams-component.service';
import { PersonalComponentService } from './pages/personal/personal-component.service';

// PROVIDER IMPORTS
import { EnvServiceProvider } from 'src/app/providers/env.service.provider';
import { AddRemoveByConceptModalComponent } from 'src/app/components/add-remove-by-concept-modal/add-remove-by-concept-modal.component';
import { ScrollTopComponent } from 'src/app/components/scroll-top/scroll-top.component';
import { ReadonlyTextModalComponent } from 'src/app/components/readonly-text-modal/readonly-text-modal.component';
import { ReadyForPublicationModalComponent } from 'src/app/components/ready-for-publication-modal/ready-for-publication-modal.component';
import { WorkflowHistoryNotesModalComponent } from 'src/app/components/workflow-history-notes-modal/workflow-history-notes-modal.component';
import { AddRemoveConceptsComponent } from 'src/app/components/add-remove-concepts/add-remove-concepts.component';
import { AuthGuardGuard } from 'src/app/services/authentication/auth-guard.guard';
import { LoginComponent } from 'src/app/auth/login/login.component';
import { InviteComponent } from 'src/app/auth/invite/invite.component';
import { ReviewModalComponent } from 'src/app/components/review-modal/review-modal.component';
import { UsersService } from './services/rest/users.service';
import { RemoveDashboardComponentModalComponent } from './components/remove-dashboard-component-modal/remove-dashboard-component-modal.component';
import { RefsetFeedbackListComponent } from './components/refset-feedback-list/refset-feedback-list.component';
import { DomService } from './services/dom.service';
import { PaginationModule } from './components/pagination/pagination.module';
import { ArtifactsService } from './services/rest/artifacts.service';
import { AuditService } from './services/rest/audit.service';
import { DirectivesModule } from './directives/directives.module';
import { RefsetMetaTableComponent } from './components/refset-meta-table/refset-meta-table.component';
import { LandingComponent } from './pages/landing/landing-page.component';
import { ConflictComponent } from './pages/conflict/conflict.component';
import { MatNativeDateModule } from '@angular/material/core';
import { MatDatepickerModule } from '@angular/material/datepicker';

const appRoutes: Routes = [
	// { path: '', pathMatch: 'full', redirectTo: '' },
	{ path: 'invite/response', component: InviteComponent },
	{ path: 'login', component: LoginComponent },
	{ path: '', component: LandingComponent },
	{ path: 'conflict', component: ConflictComponent },
	{ path: 'library', component: MapsetLibraryComponent, data: { breadcrumbLabel: 'Map Set Library' } },
	{ path: 'projects', component: MapsetProjectsComponent, data: { breadcrumbLabel: 'Map Set Projects' } },
	{ path: 'mapset/:code/mappings', component: MapsetRecordsComponent, data: { breadcrumbLabel: 'Mappings' } },
	{ path: 'mapset/:code/mappings/inactives', component: MapsetInactivesComponent, data: { breadcrumbLabel: 'Manage Inactivated Concepts' } },
	{ path: 'mapset/:code/mappings/:concepts/batch', component: BatchMappingComponent, data: { breadcrumbLabel: 'Batch Edit Mappings' } },
	{ path: 'mapset/:code/mapping/:concept', component: MapsetMappingComponent, data: { breadcrumbLabel: 'Mapping' } },
	{ path: 'mapset/:code/mapping/:concept/edit', component: EditMappingComponent, data: { breadcrumbLabel: 'Edit Map' } },
	{ path: 'dashboard', component: DashboardComponent, data: { breadcrumbLabel: 'Dashboard' }, canActivate: [AuthGuardGuard] },
	//mapset/{mapSetCode}/mapping/{conceptCode}
	{
		path: 'organizations',
		component: OrganizationsComponent,
		children: [
			{
				path: ':organizationId/edition/:editionId/projects',
				component: OrganizationProjectsComponent,
				data: { breadcrumbLabel: 'Projects' },
				canActivate: [AuthGuardGuard],
			},
			{
				path: ':organizationId/teams',
				component: OrganizationTeamsComponent,
				data: { breadcrumbLabel: 'Teams' },
				canActivate: [AuthGuardGuard],
			},
			{
				path: ':organizationId/users',
				component: OrganizationPeopleComponent,
				data: { breadcrumbLabel: 'Users' },
				canActivate: [AuthGuardGuard],
			},
			{
				path: ':organizationId/configuration',
				component: OrganizationConfigurationComponent,
				data: { breadcrumbLabel: 'Configuration' },
				canActivate: [AuthGuardGuard],
			},
		],
	},
	{
		path: 'organization',
		component: ProjectsComponent,
		children: [
			{
				path: ':organizationId/edition/:editionId/projects/:projectId/refsets',
				component: ProjectsRefsetComponent,
				data: { breadcrumbLabel: 'Reference Sets' },
				canActivate: [AuthGuardGuard],
			},
			{
				path: ':organizationId/edition/:editionId/projects/:projectId/users',
				component: ProjectsPeopleComponent,
				data: { breadcrumbLabel: 'Users' },
				canActivate: [AuthGuardGuard],
			},
			{
				path: ':organizationId/edition/:editionId/projects/:projectId/teams',
				component: ProjectsTeamsComponent,
				data: { breadcrumbLabel: 'Teams' },
				canActivate: [AuthGuardGuard],
			},
			{
				path: ':organizationId/edition/:editionId/projects/:projectId/configuration',
				component: ProjectsConfigurationComponent,
				data: { breadcrumbLabel: 'Configuration' },
				canActivate: [AuthGuardGuard],
			},
		],
	},
	{
		path: 'organization',
		component: TeamsComponent,
		children: [
			{
				path: ':organizationId/teams/:teamId/users',
				component: TeamsPeopleComponent,
				data: { breadcrumbLabel: 'Users' },
				canActivate: [AuthGuardGuard],
			},
			{
				path: ':organizationId/teams/:teamId/configuration',
				component: TeamsConfigurationComponent,
				data: { breadcrumbLabel: 'Configuration' },
				canActivate: [AuthGuardGuard],
			},
		],
	},
	{
		path: 'personal',
		component: PersonalComponent,
		children: [
			{
				path: ':userId/landing',
				component: PersonalLandingComponent,
				data: { breadcrumbLabel: 'About' },
				canActivate: [AuthGuardGuard],
			},
			{
				path: ':userId/configuration',
				component: PersonalConfigurationComponent,
				data: { breadcrumbLabel: 'Account Configuration' },
				canActivate: [AuthGuardGuard],
			},
		],
	},
	// Redirect blanks to the landing page
	{
		path: 'organization/0/edition/0/projects',
		component: LandingComponent,
	},
	{
		path: 'organization/0/edition/0/projects/0/refsets',
		component: LandingComponent,
	},
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
		TaxonomyTreeComponent,
		TemplateRendererComponent,
		RefsetDownloadComponent,
		ColumnChooserComponent,
		NotificationComponent,
		SafeUrlPipe,
		CategoryFilterComponent,
		DateTextFilterComponent,
		GridHeaderFilterComponent,
		ProjectsRefsetComponent,
		ImportFromFileModalComponent,
		ImportFromListModalComponent,
		AddMemberToOrganizationModalComponent,
		AddMemberToTeamModalComponent,
		CreateNewProjectModalComponent,
		AddRemoveByConceptModalComponent,
		ScrollTopComponent,
		ReadonlyTextModalComponent,
		ReadyForPublicationModalComponent,
		ReviewModalComponent,
		WorkflowHistoryNotesModalComponent,
		AddRemoveConceptsComponent,
		AddRemoveConceptsIconsComponent,
		AddRemoveConceptGroupIconsComponent,
		LoginComponent,
		InviteComponent,
		LandingComponent,
		DashboardComponent,
		SidebarComponent,
		MapsetLibraryComponent,
		MapsetProjectsComponent,
		MapsetRecordsComponent,
		MapsetInactivesComponent,
		MapsetMappingComponent,
		EditMappingComponent,
		BatchMappingComponent,
		OrganizationsComponent,
		OrganizationProjectsComponent,
		OrganizationTeamsComponent,
		OrganizationPeopleComponent,
		OrganizationConfigurationComponent,
		ProjectsComponent,
		ProjectsPeopleComponent,
		ProjectsTeamsComponent,
		ProjectsConfigurationComponent,
		RefsetFeedbackListComponent,
		TeamsComponent,
		TeamsConfigurationComponent,
		TeamsPeopleComponent,
		BulkUpgradeModalComponent,
		HeadingWithCountComponent,
		PageContainerComponent,
		PersonalComponent,
		PersonalLandingComponent,
		PersonalConfigurationComponent,
		RemoveDashboardComponentModalComponent,
		RefsetFeedbackListComponent,
		WorkflowStatusBadgeComponent,
		RefsetMetaTableComponent,
	],
	imports: [
		RouterModule.forChild(appRoutes),
		RouterModule.forRoot(
			appRoutes,
			{
				onSameUrlNavigation: 'reload',
				scrollPositionRestoration: 'top',
				canceledNavigationResolution: 'computed',
			}
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
		ArtifactsModule,
		AuditTrailModule,
		PaginationModule,
		DirectivesModule,
	],
	entryComponents: [NotificationComponent],
	providers: [
		AuthenticationService,
		ArtifactsService,
		AuditService,
		EnvServiceProvider,
		RestService,
		ConceptsService,
		RefsetService,
		MT2Service,
		PaginationService,
		BreadcrumbService,
		RouterExtentionService,
		ProjectsRefsetComponent,
		AddRemoveConceptsComponent,
		UsersService,
		NotificationService,
		ErrorHandlingService,
		OrganizationsComponentService,
		ProjectsComponentService,
		TeamsComponentService,
		PersonalComponentService,
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
	],
	bootstrap: [AppComponent],
	schemas: [CUSTOM_ELEMENTS_SCHEMA, NO_ERRORS_SCHEMA],
	exports: [RouterModule],
})
export class AppModule {}
