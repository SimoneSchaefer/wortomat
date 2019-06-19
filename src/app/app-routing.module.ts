import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { LoadingComponent } from './components/loading/loading.component'
import { SettingsComponent } from './components/settings/settings.component';
import { ProjectsComponent } from './components/projects/projects.component';
import { ProjectEditComponent } from './components/project-edit/project-edit.component';
import { ConnectionGuard } from './guards/connection.guard';
import { PartsComponent } from './components/parts/parts.component';
import { PeopleComponent } from './components/people/people.component';
import { LocationsComponent } from './components/locations/locations.component';
import { BackgroundsComponent } from './components/backgrounds/backgrounds.component';
import { PlotlinesComponent } from './components/plotlines/plotlines.component';
import { ExportComponent } from './components/export/export.component';

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
    path : 'people',
    component : PeopleComponent
  },
  {
    path : 'locations',
    component : LocationsComponent
  },
  {
    path : 'backgrounds',
    component : BackgroundsComponent
  },
  {
    path : 'plotlines',
    component : PlotlinesComponent
  },
  {
    path : 'export',
    component : ExportComponent
  }
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
