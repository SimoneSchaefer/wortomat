import { Component, OnInit, NgZone } from '@angular/core';
import { BaseDetailComponent } from '../_baseEditComponent';
import { ActivatedRoute, Params, Router } from '@angular/router';
import { ProjectService } from "../../services/electron/project.service"
import { ProjectEntity } from '../../entity/ProjectEntity';
import { BaseEntity } from '../../entity/_baseEntity';
import { AlertService } from '../../services/alert.service';

@Component({
  selector: 'app-project-edit',
  templateUrl: './project-edit.component.html',
  styleUrls: ['./project-edit.component.scss']
})
export class ProjectEditComponent extends BaseDetailComponent {

  constructor(
    route : ActivatedRoute, 
    router : Router, 
    baseService: ProjectService,
    alertService : AlertService, 
    zone : NgZone) {
    super(route, router, baseService, alertService, zone);
  }



  protected afterCreate(entity: BaseEntity) {
    let proj = entity as ProjectEntity;    
  }

  protected createNewModel() : ProjectEntity {
    let proj = new ProjectEntity();    
    return proj;
  }

}