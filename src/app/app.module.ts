import 'zone.js/dist/zone-mix';
import 'reflect-metadata';
import '../polyfills';
import { BrowserModule } from '@angular/platform-browser';
import { NgModule } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { NotifierModule } from 'angular-notifier';

import { HttpClientModule, HttpClient } from '@angular/common/http';

import { AppRoutingModule } from './app-routing.module';

// NG Translate
import { TranslateModule, TranslateLoader } from '@ngx-translate/core';
import { TranslateHttpLoader } from '@ngx-translate/http-loader';

import { ElectronService } from './services/electron/electron.service';

import { WebviewDirective } from './directives/webview.directive';

import { AppComponent } from './app.component';
import { HomeComponent } from './components/home/home.component';
import { LoadingComponent } from './components/loading/loading.component';
import { SettingsComponent } from './components/settings/settings.component';
import { ProjectsComponent } from './components/projects/projects.component';
import { AlertService } from './services/alert.service';
import { ProjectEditComponent } from './components/project-edit/project-edit.component';
import { PartsComponent } from './components/parts/parts.component';
import { PartComponent } from './components/part/part.component';
import { PartEditComponent } from './components/part-edit/part-edit.component';
import { ChapterEditComponent } from './components/chapter-edit/chapter-edit.component';
import { VerticalBarComponent } from './components/vertical-bar/vertical-bar.component';
import { ImageUploadComponent } from './components/image-upload/image-upload.component';
import { ImageUploadModule } from 'ng2-imageupload';
import { OptionalImageComponent } from './components/optional-image/optional-image.component';

// AoT requires an exported function for factories
export function HttpLoaderFactory(http: HttpClient) {
  return new TranslateHttpLoader(http, './assets/i18n/', '.json');
}

@NgModule({
  declarations: [
    AppComponent,
    HomeComponent,
    WebviewDirective,
    LoadingComponent,
    SettingsComponent,
    ProjectsComponent,
    ProjectEditComponent,
    PartsComponent,
    PartComponent,
    PartEditComponent,
    ChapterEditComponent,
    VerticalBarComponent,
    ImageUploadComponent,
    OptionalImageComponent
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
    ImageUploadModule
  ],
  providers: [ElectronService, AlertService],
  bootstrap: [AppComponent]
})
export class AppModule { }
