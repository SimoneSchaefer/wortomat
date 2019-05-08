import { Component, OnInit, ApplicationRef } from '@angular/core';
import { ProjectService } from '../../services/electron/project.service';
import { ResponseType } from '../../message/Message';
import { BaseEntity } from '../../entity/_baseEntity';
import { AlertService } from '../../services/alert.service';
import { ProjectEntity } from '../../entity/ProjectEntity';
import { OpenProjectService } from '../../services/open-project.service';
import { Router } from '@angular/router';
import { BaseEntityComponent } from '../_baseEntityComponent';

@Component({
  selector: 'app-projects',
  templateUrl: './projects.component.html',
  styleUrls: ['./projects.component.scss']
})
export class ProjectsComponent extends BaseEntityComponent {

  constructor(_baseService: ProjectService, _openProjectService: OpenProjectService, _alertService: AlertService, private _router : Router) {
    super(_baseService,
      null, 
      _openProjectService, 
      _alertService);
  }


  open(project: ProjectEntity) {
    let $this = this;
    let projectService = $this.baseService as ProjectService;
    projectService.open(project, function (response) {
      console.dir(response);
      if (response.responseType == ResponseType.SUCCESS) {
        $this.alertService.success('PROJECTS.OPENED_SUCCESS');
        $this.openProjectService.identifier = response.msg;
        $this._router.navigateByUrl('/parts');
      } else {
        $this.alertService.error(`ERROR_PROJECTS_${response.msg}`);
      }
    });
  }
}