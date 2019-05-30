import { Component, OnInit } from '@angular/core';
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
import { CharacterGroupEntity } from '../../entity/CharacterGroupEntity';
import { CharacterGroupService } from '../../services/electron/character-group.service';
import { CharacterService } from '../../services/electron/character.service';

@Component({
  selector: 'app-people',
  templateUrl: './people.component.html',
  styleUrls: ['./people.component.scss']
})
export class PeopleComponent extends BaseEntityComponent  {

  constructor(
    _groupService: CharacterGroupService, 
    _memberService : CharacterService,
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
    return new PartEntity();
  }
  protected newMember(parent : PartEntity) : BaseEntity {
    let member = new ChapterEntity();
    member.parent = parent;
    return member;
  }
  protected entityType() : ENTITY_TYPE {
    return ENTITY_TYPE.CHARACTERS;
  }
}
