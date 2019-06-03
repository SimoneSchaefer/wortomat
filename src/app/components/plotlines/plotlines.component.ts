import { Component, OnInit } from '@angular/core';
import { BaseEntityComponent } from '../_baseEntityComponent';
import { PlotlineGroupEntity } from '../../entity/PlotlineGroupEntity';
import { PlotlineGroupService } from '../../services/electron/plotline-group.service';
import { PlotlineService } from '../../services/electron/plotline.service';
import { OpenProjectService } from '../../services/open-project.service';
import { AlertService } from '../../services/alert.service';
import { TranslateService } from '@ngx-translate/core';
import { BaseGroupEntity } from '../../entity/_baseGroupEntity';
import { PlotlineEntity } from '../../entity/PlotlineEntity';
import { BaseEntity, ENTITY_TYPE } from '../../entity/_baseEntity';

@Component({
  selector: 'app-plotlines',  
  templateUrl: '../_baseEntityComponent.html'
})
export class PlotlinesComponent  extends BaseEntityComponent  {

  constructor(
    _groupService: PlotlineGroupService, 
    _memberService : PlotlineService,
    _openProjectService: OpenProjectService, 
    _alertService: AlertService, 
    _translationService : TranslateService) {
    super(_groupService, 
      _memberService,
      _openProjectService, 
      _alertService,
      _translationService);
  }


  protected newGroup() : BaseGroupEntity {
    return new PlotlineGroupEntity();
  }
  protected newMember(parent : PlotlineGroupEntity) : BaseEntity {
    let member = new PlotlineEntity();
    member.parent = parent;
    return member;
  }
  protected entityType() : ENTITY_TYPE {
    return ENTITY_TYPE.PLOTLINES;
  }
}
