import { Component, OnInit, NgZone } from '@angular/core';
import { BaseDetailComponent } from '../_baseEditComponent';
import { ActivatedRoute, Router } from '@angular/router';
import { PartService } from '../../services/electron/part.service';
import { AlertService } from '../../services/alert.service';
import { PartEntity } from '../../entity/PartEntity';

@Component({
  selector: 'app-part-edit',
  templateUrl: './part-edit.component.html',
  styleUrls: ['./part-edit.component.scss']
})
export class PartEditComponent extends BaseDetailComponent {

  constructor(
    route : ActivatedRoute, 
    router : Router, 
    baseService: PartService,
    alertService : AlertService) {
    super(route, router, baseService, alertService);
  }


  protected createNewModel() : PartEntity {
    let proj = new PartEntity();    
    return proj;
  }

}