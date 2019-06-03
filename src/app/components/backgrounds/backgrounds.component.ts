import { Component, OnInit } from '@angular/core';
import { BaseEntityComponent } from '../_baseEntityComponent';
import { BaseGroupEntity } from '../../entity/_baseGroupEntity';
import { BackgroundGroupService } from '../../services/electron/background-group.service';
import { BackgroundService } from '../../services/electron/background.service';
import { OpenProjectService } from '../../services/open-project.service';
import { AlertService } from '../../services/alert.service';
import { TranslateService } from '@ngx-translate/core';
import { BackgroundGroupEntity } from '../../entity/BackgroundGroupEntity';
import { BackgroundEntity } from '../../entity/BackgroundEntity';
import { ENTITY_TYPE, BaseEntity } from '../../entity/_baseEntity';

@Component({
  selector: 'app-backgrounds',
  templateUrl: '../_baseEntityComponent.html'
})
export class BackgroundsComponent  extends BaseEntityComponent  {

  constructor(
    _groupService: BackgroundGroupService, 
    _memberService : BackgroundService,
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
    return new BackgroundGroupEntity();
  }
  protected newMember(parent : BackgroundGroupEntity) : BaseEntity {
    let member = new BackgroundEntity();
    member.parent = parent;
    return member;
  }
  protected entityType() : ENTITY_TYPE {
    return ENTITY_TYPE.BACKGROUNDS;
  }

}
