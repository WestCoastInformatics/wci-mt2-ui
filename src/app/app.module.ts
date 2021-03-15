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
import { MatSelectModule } from '@angular/material/select';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatIconModule } from '@angular/material/icon';
import { AppComponent } from 'src/app/app.component';
import { BackendInterceptor } from 'src/app/interceptors/backend.interceptor';
import { HeaderInterceptor } from 'src/app/interceptors/header.interceptor';
import { NgbTypeaheadModule } from '@ng-bootstrap/ng-bootstrap';
import { TreeModule } from '@circlon/angular-tree-component';
import { AgGridModule } from 'ag-grid-angular';

// MODULE IMPORTS
import { DialogModule } from 'src/app/dialog/dialog.module';

// COMPONENT IMPORTS
import { NavbarComponent } from 'src/app/components/navbar/navbar.component';
import { FooterComponent } from 'src/app/components/footer/footer.component';
import { TaxonomyTreeComponent } from 'src/app/components/taxonomy-tree/taxonomy-tree.component';
import { TemplateRenderer } from 'src/app/components/cellRenderers/template.renderer';
import { TemplateComponent } from 'src/app/pages/template.component';
import { RefsetDirectory } from 'src/app/pages/refset-directory';

// SERVICE IMPORTS
import { AuthenticationService } from 'src/app/services/authentication/authentication.service';
import { AuthoringService } from 'src/app/services/authoring/authoring.service';
import { RestService } from 'src/app/services/rest/rest.service';
import { ConceptsService } from 'src/app/services/rest/concepts.service';
import { RefsetService } from 'src/app/services/rest/refset.service';

// PROVIDER IMPORTS
import { EnvServiceProvider } from 'src/app/providers/env.service.provider';

@NgModule({
    declarations: [
        AppComponent,
        NavbarComponent,
        FooterComponent,
        TaxonomyTreeComponent,
        TemplateRenderer,
        TemplateComponent,
        RefsetDirectory
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
        MatSelectModule,
        MatFormFieldModule,
        MatIconModule,
        DialogModule,
        TreeModule,
        AgGridModule.withComponents([TemplateRenderer])
    ],
    entryComponents: [],
    providers: [
        AuthenticationService,
        AuthoringService,
        EnvServiceProvider,
        RestService,
        ConceptsService,
        RefsetService,
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
