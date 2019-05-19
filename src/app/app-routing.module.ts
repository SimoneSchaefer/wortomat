import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { LoadingComponent } from './components/loading/loading.component'
import { SettingsComponent } from './components/settings/settings.component';
import { ProjectsComponent } from './components/projects/projects.component';
import { ProjectEditComponent } from './components/project-edit/project-edit.component';
import { ConnectionGuard } from './guards/connection.guard';
import { PartsComponent } from './components/parts/parts.component';
import { ChapterEditComponent } from './components/chapter-edit/chapter-edit.component';

const routes: Routes = [
  {
    path: '',
    component: LoadingComponent,
  },
  {
    path: 'settings',
    component: SettingsComponent,
  },
  {
    path: 'projects',
    component: ProjectsComponent,
    canActivate: [ConnectionGuard]
  },
  {
    path : 'projects/add',
    component : ProjectEditComponent
  },
  {
    path : 'projects/edit/:id',
    component : ProjectEditComponent
  },
  {
    path : 'parts',
    component : PartsComponent
  },
  {
    path : 'chapters/add/:partId',
    component : ChapterEditComponent
  },
  {
    path : 'chapters/edit/:id',
    component : ChapterEditComponent
  },
];



@NgModule({
  imports: [
    RouterModule.forRoot(routes)
  ],
  exports: [
    RouterModule
  ],
  declarations: []
})
export class AppRoutingModule { }
