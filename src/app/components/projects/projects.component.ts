import { Component, OnInit, ApplicationRef } from '@angular/core';
import { ProjectService } from '../../services/electron/project.service';
import { ResponseType } from '../../message/Message';
import { BaseEntity, ENTITY_TYPE } from '../../entity/_baseEntity';
import { AlertService } from '../../services/alert.service';
import { ProjectEntity } from '../../entity/ProjectEntity';
import { OpenProjectService } from '../../services/open-project.service';
import { Router } from '@angular/router';
import { BaseEntityComponent } from '../_baseEntityComponent';
import { TranslateService } from '@ngx-translate/core';
import { PartEntity } from '../../entity/PartEntity';
import { NgbModal } from '@ng-bootstrap/ng-bootstrap';
import { StateService } from '../../services/state.service';

@Component({
  selector: 'app-projects',
  templateUrl: './projects.component.html',
  styleUrls: ['./projects.component.scss']
})
export class ProjectsComponent extends BaseEntityComponent {

  constructor(
    _baseService: ProjectService, 
    _openProjectService: OpenProjectService, 
    _alertService: AlertService, 
    _translationService : TranslateService,  
    _modalService: NgbModal,
    _stateService: StateService , 
    private _router : Router) {
    super(_baseService,
      _baseService, 
      _openProjectService, 
      _alertService,
      _translationService,
      _modalService,
      _stateService
      );
  }
  protected newGroup() : BaseEntity {
    return new ProjectEntity();
  }
  protected newMember() : BaseEntity {
    return new PartEntity();
  }
  protected entityType() : ENTITY_TYPE {
    return ENTITY_TYPE.PROJECTS;
  }


  open(project: ProjectEntity) {
    let $this = this;
    let projectService = $this.baseService as ProjectService;
    projectService.open(project, function (response) {
      if (response.responseType == ResponseType.SUCCESS) {
       // $this.alertService.success('PROJECTS.OPENED_SUCCESS');
        $this.openProjectService.identifier = response.msg;
        $this._router.navigateByUrl('/parts');
      } else {
        $this.alertService.error(`ERROR_PROJECTS_${response.msg}`);
      }
    });
  }
}