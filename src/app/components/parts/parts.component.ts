import { Component } from '@angular/core';
import { BaseEntityComponent } from '../_baseEntityComponent';
import { PartService } from '../../services/electron/part.service';
import { OpenProjectService } from '../../services/open-project.service';
import { AlertService } from '../../services/alert.service';
import { ChapterService } from '../../services/electron/chapter.service';
import { TranslateService } from '@ngx-translate/core';
import { PartEntity } from '../../entity/PartEntity';
import { BaseEntity, ENTITY_TYPE } from '../../entity/_baseEntity';
import { ChapterEntity } from '../../entity/ChapterEntity';
import { BaseGroupEntity } from '../../entity/_baseGroupEntity';
import { NgbModal } from '@ng-bootstrap/ng-bootstrap';

@Component({
  selector: 'app-parts',
  templateUrl: '../_baseEntityComponent.html'
})
export class PartsComponent extends BaseEntityComponent  {

  constructor(
    _groupService: PartService, 
    _memberService : ChapterService,
    _openProjectService: OpenProjectService, 
    _alertService: AlertService, 
    _translationService : TranslateService,
    _modalService: NgbModal
    ) {
    super(_groupService, 
      _memberService,
      _openProjectService, 
      _alertService,
      _translationService,
      _modalService);
  }


  protected newGroup() : BaseGroupEntity {
    let part = new PartEntity();
    part.children = [];
    return part;
  }
  protected newMember(parent : PartEntity) : BaseEntity {
    let member = new ChapterEntity();
    member.parent = parent;
    return member;
  }
  protected entityType() : ENTITY_TYPE {
    return ENTITY_TYPE.PARTS;
  }
}
