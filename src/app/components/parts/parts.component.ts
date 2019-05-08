import { Component, OnInit } from '@angular/core';
import { BaseEntityComponent } from '../_baseEntityComponent';
import { PartService } from '../../services/electron/part.service';
import { OpenProjectService } from '../../services/open-project.service';
import { AlertService } from '../../services/alert.service';
import { ProjectService } from '../../services/electron/project.service';
import { Router } from '@angular/router';
import { ResponseType } from '../../message/Message';
import { ChapterService } from '../../services/electron/chapter.service';

@Component({
  selector: 'app-parts',
  templateUrl: './parts.component.html',
  styleUrls: ['./parts.component.scss']
})
export class PartsComponent extends BaseEntityComponent  {

  constructor(
    _groupService: PartService, 
    _memberService : ChapterService,
    _openProjectService: OpenProjectService, 
    _alertService: AlertService, 
    private _projectService : ProjectService, private _router : Router) {
    super(_groupService, 
      _memberService,
      _openProjectService, 
      _alertService);
  }


  







}
