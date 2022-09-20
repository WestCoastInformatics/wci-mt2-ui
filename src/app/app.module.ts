// FRAMEWORK IMPORTS
import { BrowserModule } from '@angular/platform-browser';
import { CUSTOM_ELEMENTS_SCHEMA, NgModule, NO_ERRORS_SCHEMA } from '@angular/core';
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
import { TemplateRenderer } from 'src/app/components/cellRenderers/template.renderer';
import { RefsetDownloadComponent } from 'src/app/components/refsetDownload/refset-download.component';
import { ColumnChooserComponent } from 'src/app/components/column-chooser/column-chooser.component';
import { LaunchComparisonModalComponent } from 'src/app/components/comparison/launch-comparison-modal.component';
import { NotificationComponent } from 'src/app/components/notification/notification.component';
import { DateTextFilterComponent } from 'src/app/components/dateTextFilter/date-text-filter.component';
import { CategoryFilterComponent } from 'src/app/components/categoryFilter/category-filter.component';
import { CreateNewRefsetComponent } from './components/create-new-refset/create-new-refset.component';
import { ImportFromFileModalComponent } from 'src/app/components/import-from-file-modal/import-from-file-modal.component';
import { ImportFromListModalComponent } from 'src/app/components/import-from-list-modal/import-from-list-modal.component';
import { ImportFromEclModalComponent } from 'src/app/components/import-from-ecl-modal/import-from-ecl-modal.component';
import { CreateNewOrganizationModalComponent } from 'src/app/components/create-new-organization-modal/create-new-organization-modal.component';
import { EmailRefsetModalComponent } from 'src/app/components/email-refset-modal/email-refset-modal.component';
import { CreateNewTeamModalComponent } from 'src/app/components/create-new-team-modal/create-new-team-modal.component';
import { BulkUpgradeModalComponent } from 'src/app/components/bulk-upgrade-modal/bulk-upgrade-modal.component';
import { AddMemberModalComponent } from 'src/app/components/add-member-modal/add-member-modal.component';
import { CreateNewProjectModalComponent } from 'src/app/components/create-new-project-modal/create-new-project-modal.component';
import { AddRemoveConceptsIconsComponent } from 'src/app/components/add-remove-concepts-icons/add-remove-concepts-icons.component';
import { AddRemoveConceptGroupIconsComponent } from 'src/app/components/add-remove-concepts-icons/add-remove-concept-group-icons.component';
import { WorkflowStatusBadgeComponent } from './components/workflow-status-badge/workflow-status-badge.component';
import { ArtifactsModule } from './components/artifacts/artifacts.module';
import { AuditTrailModule } from './components/audit-trail/audit-trail.module';

// import { FeedbackCollectorComponent } from 'src/app/components/feedback-collector.component';
// PAGE IMPORTS
import { RefsetDirectory } from 'src/app/pages/refset-directory';
import { RefsetDetails } from 'src/app/pages/refset-details';
import { DashboardComponent } from './pages/dashboard/dashboard.component';
import { FeedbackCollectorComponent } from './components/feedback-collector/feedback-collector.component';
import { ProjectsRefsetComponent } from './pages/projects/refsets/projects-refset.component';
import { OrganizationProjectsComponent } from './pages/organizations/projects/projects.component';
import { OrganizationTeamsComponent } from './pages/organizations/teams/teams.component';
import { OrganizationPeopleComponent } from './pages/organizations/people/people.component';
import { OrganizationConfigurationComponent } from './pages/organizations/configuration/configuration.component';
import { ProjectsPeopleComponent } from './pages/projects/people/people.component';
import { ProjectsConfigurationComponent } from './pages/projects/configuration/configuration.component';
import { TeamsPeopleComponent } from './pages/teams/people/people.component';
import { TeamsConfigurationComponent } from './pages/teams/configuration/configuration.component';
import { PersonalLandingComponent } from './pages/personal/landing/landing.component';
import { PersonalConfigurationComponent } from './pages/personal/configuration/configuration.component';

// SERVICE IMPORTS
import { AuthenticationService } from 'src/app/services/authentication/authentication.service';
import { AuthoringService } from 'src/app/services/authoring/authoring.service';
import { RestService } from 'src/app/services/rest/rest.service';
import { ConceptsService } from 'src/app/services/rest/concepts.service';
import { RefsetService } from 'src/app/services/rest/refset.service';
import { PaginationService } from 'src/app/services/pagination.service';
import { BreadcrumbService } from 'src/app/services/breadcrumb.service';
import { RouterExtentionService } from 'src/app/services/routerExtention.service';
import { NotificationService } from 'src/app/services/notification.service';

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
import { ReviewModalComponent } from 'src/app/components/review-modal/review-modal.component';
import { LandingPageComponent } from './pages/landing-page/landing-page.component';
import { UpgradeModalComponent } from './components/upgrade-modal/upgrade-modal.component';
import { FinishUpgradeModalComponent } from './components/finish-upgrade-modal/finish-upgrade-modal.component';
import { AdjudicateUpgradeModalComponent } from './components/adjudicate-upgrade-modal/adjudicate-upgrade-modal.component';
import { UsersService } from './services/rest/users.service';
import { RemoveDashboardComponentModalComponent } from './components/remove-dashboard-component-modal/remove-dashboard-component-modal.component';
import { RefsetFeedbackListComponent } from './components/refset-feedback-list/refset-feedback-list.component';
import { CommonModule } from '@angular/common';
import { CustomTooltipComponent } from './components/custom-tooltip/custom-tooltip.component';
import { ComposeModalComponent } from './components/compose-modal/compose-modal.component';
import { DomService } from './services/dom.service';
import { PaginationModule } from './components/pagination/pagination.module';
import { ArtifactsService } from './services/rest/artifacts.service';
import { AuditService } from './services/rest/audit.service';
import { DirectivesModule } from './directives/directives.module';
import { RefsetMetaTableComponent } from './components/refset-meta-table/refset-meta-table.component';
import { ShareRefsetModalComponent } from './components/share-modal/share-refset-modal.component';
import { CreateRefsetComponent } from './components/create-refset/create-refset.component';
import { InvitePeopleModalComponent } from './components/invite-people-modal/invite-people-modal.component';
import { RequestAccessModalComponent } from './components/request-access-modal/request-access-modal.component';
import { LandingComponent } from './pages/landing/landing-page.component';
import { MatNativeDateModule } from '@angular/material/core';
import { MatDatepickerModule } from '@angular/material/datepicker';

const appRoutes: Routes = [
    // { path: '', pathMatch: 'full', redirectTo: '' },
    { path: 'login', component: LoginComponent },
    { path: '', component: LandingComponent },
    { path: 'library', component: RefsetDirectory, data: { breadcrumbLabel: 'Reference Set Library' } },
    { path: 'details/:refsetId/:versionDate', component: RefsetDetails, data: { breadcrumbLabel: 'Reference Set Details', editMode: false } },
    { path: 'dashboard', component: DashboardComponent, data: { breadcrumbLabel: 'Dashboard' }, canActivate: [AuthGuardGuard] },

    {
        path: 'organizations/:organizationId/edition/:editionId/projects',
        component: OrganizationProjectsComponent,
        data: { breadcrumbLabel: 'Projects' },
        canActivate: [AuthGuardGuard]
    },
    {
        path: 'organizations/:organizationId/teams',
        component: OrganizationTeamsComponent,
        data: { breadcrumbLabel: 'Teams' },
        canActivate: [AuthGuardGuard]
    },
    {
        path: 'organizations/:organizationId/people',
        component: OrganizationPeopleComponent,
        data: { breadcrumbLabel: 'People' },
        canActivate: [AuthGuardGuard]
    },
    {
        path: 'organizations/:organizationId/configuration',
        component: OrganizationConfigurationComponent,
        data: { breadcrumbLabel: 'Configuration' },
        canActivate: [AuthGuardGuard]
    },

    {
        path: 'organization/:organizationId/edition/:editionId/projects/:projectId/refsets',
        component: ProjectsRefsetComponent,
        data: { breadcrumbLabel: 'Reference Sets' },
        canActivate: [AuthGuardGuard]
    },
    {
        path: 'organization/:organizationId/edition/:editionId/projects/:projectId/people',
        component: ProjectsPeopleComponent,
        data: { breadcrumbLabel: 'People' },
        canActivate: [AuthGuardGuard]
    },
    {
        path: 'organization/:organizationId/edition/:editionId/projects/:projectId/configuration',
        component: ProjectsConfigurationComponent,
        data: { breadcrumbLabel: 'Configuration' },
        canActivate: [AuthGuardGuard]
    },

    {
        path: 'organization/:organizationId/teams/:teamId/people',
        component: TeamsPeopleComponent,
        data: { breadcrumbLabel: 'People' },
        canActivate: [AuthGuardGuard]
    },
    {
        path: 'organization/:organizationId/teams/:teamId/configuration',
        component: TeamsConfigurationComponent,
        data: { breadcrumbLabel: 'Configuration' },
        canActivate: [AuthGuardGuard]
    },

    {
        path: 'personal/:userId/landing',
        component: PersonalLandingComponent,
        data: { breadcrumbLabel: 'About' },
        canActivate: [AuthGuardGuard]
    },
    {
        path: 'personal/:userId/configuration',
        component: PersonalConfigurationComponent,
        data: { breadcrumbLabel: 'Account Configuration' },
        canActivate: [AuthGuardGuard]
    },
];

@NgModule({
    declarations: [
        AppComponent,
        NavbarComponent,
        FooterComponent,
        TaxonomyTreeComponent,
        TemplateRenderer,
        RefsetDownloadComponent,
        ColumnChooserComponent,
        NotificationComponent,
        UpgradeModalComponent,
        FinishUpgradeModalComponent,
        AdjudicateUpgradeModalComponent,
        SafeUrlPipe,
        RefsetDirectory,
        RefsetDetails,
        CategoryFilterComponent,
        DateTextFilterComponent,
        CreateNewRefsetComponent,
        CreateRefsetComponent,
        ProjectsRefsetComponent,
        ImportFromFileModalComponent,
        ImportFromListModalComponent,
        ImportFromEclModalComponent,
        CreateNewOrganizationModalComponent,
        EmailRefsetModalComponent,
        CreateNewTeamModalComponent,
        AddMemberModalComponent,
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
        LandingPageComponent,
        LandingComponent,
        DashboardComponent,
        FeedbackCollectorComponent,
        SidebarComponent,
        OrganizationProjectsComponent,
        OrganizationTeamsComponent,
        OrganizationPeopleComponent,
        OrganizationConfigurationComponent,
        ProjectsPeopleComponent,
        ProjectsConfigurationComponent,
        RefsetFeedbackListComponent,
        TeamsConfigurationComponent,
        TeamsPeopleComponent,
        PersonalLandingComponent,
        PersonalConfigurationComponent,
        LaunchComparisonModalComponent,
        RemoveDashboardComponentModalComponent,
        RefsetFeedbackListComponent,
        CustomTooltipComponent,
        ComposeModalComponent,
        WorkflowStatusBadgeComponent,
        RefsetMetaTableComponent,
        ShareRefsetModalComponent,
        InvitePeopleModalComponent,
        RequestAccessModalComponent
    ],
    imports: [
        RouterModule.forRoot(
            appRoutes,
            {
                onSameUrlNavigation: 'reload',
                scrollPositionRestoration: 'top'
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
        MatButtonToggleModule,
        MatDatepickerModule,
        MatNativeDateModule,
        MatMenuModule,
        MatIconModule,
        MatRadioModule,
        DragDropModule,
        ToastNoAnimationModule.forRoot({
            toastComponent: NotificationComponent
        }),
        DialogModule,
        TreeModule,
        AgGridModule.withComponents([TemplateRenderer, CustomTooltipComponent]),
        EditorModule,
        AngularSplitModule,
        NgbModule,
        ReactiveFormsModule,
        MatSlideToggleModule,
        CommonModule,
        ArtifactsModule,
        AuditTrailModule,
        PaginationModule,
        DirectivesModule
    ],
    entryComponents: [NotificationComponent],
    providers: [
        AuthenticationService,
        AuthoringService,
        ArtifactsService,
        AuditService,
        EnvServiceProvider,
        RestService,
        ConceptsService,
        RefsetService,
        RefsetDetails,
        PaginationService,
        BreadcrumbService,
        RouterExtentionService,
        ProjectsRefsetComponent,
        AddRemoveConceptsComponent,
        UsersService,
        NotificationService,
        DomService,
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
        },
        { provide: RouteReuseStrategy, useClass: CustomReuseStrategy }
    ],
    bootstrap: [AppComponent],
    schemas: [CUSTOM_ELEMENTS_SCHEMA, NO_ERRORS_SCHEMA]
})
export class AppModule {
}
