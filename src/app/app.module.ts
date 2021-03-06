import 'zone.js/dist/zone-mix';
import 'reflect-metadata';
import '../polyfills';
import { BrowserModule } from '@angular/platform-browser';
import { NgModule } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { NotifierModule } from 'angular-notifier';
import { ReactiveFormsModule } from '@angular/forms';
import { NgSelectModule } from '@ng-select/ng-select';
import { HttpClientModule, HttpClient } from '@angular/common/http';

import { AppRoutingModule } from './app-routing.module';

// NG Translate
import { TranslateModule, TranslateLoader } from '@ngx-translate/core';
import { TranslateHttpLoader } from '@ngx-translate/http-loader';

import { ElectronService } from './services/electron/electron.service';

import { WebviewDirective } from './directives/webview.directive';

import { AppComponent } from './app.component';
import { LoadingComponent } from './components/loading/loading.component';
import { SettingsComponent } from './components/settings/settings.component';
import { ProjectsComponent } from './components/projects/projects.component';
import { AlertService } from './services/alert.service';
import { ProjectEditComponent } from './components/project-edit/project-edit.component';
import { PartsComponent } from './components/parts/parts.component';
import { VerticalBarComponent } from './components/vertical-bar/vertical-bar.component';
import { ImageUploadComponent } from './components/image-upload/image-upload.component';
import { ImageUploadModule } from 'ng2-imageupload';
import { OptionalImageComponent } from './components/optional-image/optional-image.component';
import { StateService } from './services/state.service';
import {BrowserAnimationsModule} from '@angular/platform-browser/animations';
import {DragDropModule} from '@angular/cdk/drag-drop';
import { InlineEditComponent } from './components/inline-edit/inline-edit.component';
import { PeopleComponent } from './components/people/people.component';
import { LocationsComponent } from './components/locations/locations.component';
import { PlotlinesComponent } from './components/plotlines/plotlines.component';
import { BackgroundsComponent } from './components/backgrounds/backgrounds.component';
import {NgbModule} from '@ng-bootstrap/ng-bootstrap';

import 'froala-editor/js/plugins.pkgd.min.js';
import 'froala-editor/js/plugins/colors.min.js';
import { FroalaEditorModule, FroalaViewModule } from 'angular-froala-wysiwyg';

import { ExportComponent } from './components/export/export.component';
import { EditorComponent } from './components/editor/editor.component';
import { WysiwygEditorComponent } from './components/wysiwyg-editor/wysiwyg-editor.component';
import { EditDetailsComponent } from './components/edit-details/edit-details.component';
import { StatusIconPipe } from './pipes/status-icon.pipe';
import { ConfirmationDialogComponent } from './components/confirmation-dialog/confirmation-dialog.component';
import { ConfirmationDialogService } from './components/confirmation-dialog/confirmation-dialog.service';

// AoT requires an exported function for factories
export function HttpLoaderFactory(http: HttpClient) {
  return new TranslateHttpLoader(http, './assets/i18n/', '.json');
}

@NgModule({
  declarations: [
    AppComponent,
    WebviewDirective,
    LoadingComponent,
    SettingsComponent,
    ProjectsComponent,
    ProjectEditComponent,
    PartsComponent,
    VerticalBarComponent,
    ImageUploadComponent,
    OptionalImageComponent,
    InlineEditComponent,
    PeopleComponent,
    LocationsComponent,
    PlotlinesComponent,
    BackgroundsComponent,
    ExportComponent,
    EditorComponent,
    WysiwygEditorComponent,
    EditDetailsComponent,
    StatusIconPipe,
    ConfirmationDialogComponent
  ],
  imports: [
    BrowserModule,
    FormsModule,
    HttpClientModule,
    AppRoutingModule,
    TranslateModule.forRoot({
      loader: {
        provide: TranslateLoader,
        useFactory: (HttpLoaderFactory),
        deps: [HttpClient]
      }
    }),
    NotifierModule,
    ImageUploadModule,
    BrowserAnimationsModule,
    DragDropModule,
    ReactiveFormsModule,
    FroalaEditorModule.forRoot(), 
    FroalaViewModule.forRoot(),
    NgbModule,
    NgSelectModule
  ],
  entryComponents: [
    WysiwygEditorComponent,
    EditDetailsComponent,
    ConfirmationDialogComponent
  ],
  providers: [ElectronService, AlertService, StateService, ConfirmationDialogService],
  bootstrap: [AppComponent]
})
export class AppModule { }
