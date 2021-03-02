// FRAMEWORK IMPORTS
import { BrowserModule } from '@angular/platform-browser';
import { NgModule } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { HttpClientModule } from '@angular/common/http';
import { BrowserAnimationsModule } from '@angular/platform-browser/animations';
import { HTTP_INTERCEPTORS } from '@angular/common/http';
import { MatTableModule } from '@angular/material/table';
import { MatPaginatorModule } from '@angular/material/paginator';
import { MatSortModule  } from '@angular/material/sort';
import { MatExpansionModule } from '@angular/material/expansion';
import { MatInputModule } from '@angular/material/input';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatIconModule } from '@angular/material/icon';
import { AppComponent } from './app.component';
import { BackendInterceptor } from './interceptors/backend.interceptor';
import { HeaderInterceptor } from './interceptors/header.interceptor';
import { NgbTypeaheadModule } from '@ng-bootstrap/ng-bootstrap';
import { TreeModule } from '@circlon/angular-tree-component';
import { AgGridModule } from 'ag-grid-angular';

// MODULE IMPORTS
import { DialogModule } from './dialog/dialog.module';

// COMPONENT IMPORTS
import { NavbarComponent } from './components/navbar/navbar.component';
import { FooterComponent } from './components/footer/footer.component';
import { TaxonomyTreeComponent } from './components/taxonomy-tree/taxonomy-tree.component';
import { ConceptFeedbackRenderer } from './components/cellRenderers/concept-feedback.renderer';

// SERVICE IMPORTS
import { AuthenticationService } from './services/authentication/authentication.service';
import { AuthoringService } from './services/authoring/authoring.service';

// PROVIDER IMPORTS
import { EnvServiceProvider } from './providers/env.service.provider';
import { RestApiCallService } from './services/rest/rest-api-call.service';
import { ConceptsService } from './services/rest/concepts.service';

@NgModule({
    declarations: [
        AppComponent,
        NavbarComponent,
        FooterComponent,
        TaxonomyTreeComponent,
        ConceptFeedbackRenderer
    ],
    imports: [
        BrowserModule,
        FormsModule,
        HttpClientModule,
        BrowserAnimationsModule,
        NgbTypeaheadModule,
        MatTableModule,
        MatPaginatorModule,
        MatSortModule,
        MatExpansionModule, 
        MatInputModule,
        MatFormFieldModule,
        MatIconModule,
        DialogModule,
        TreeModule,
        AgGridModule.withComponents([ConceptFeedbackRenderer])
    ],
    entryComponents: [],
    providers: [
        AuthenticationService,
        AuthoringService,
        EnvServiceProvider,
        RestApiCallService,
        ConceptsService,
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
    bootstrap: [AppComponent]
})
export class AppModule {
}
