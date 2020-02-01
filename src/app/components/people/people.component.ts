import { Component } from '@angular/core';
import { BaseEntityComponent } from '../_baseEntityComponent';
import { OpenProjectService } from '../../services/open-project.service';
import { AlertService } from '../../services/alert.service';
import { TranslateService } from '@ngx-translate/core';
import { BaseEntity, ENTITY_TYPE } from '../../entity/_baseEntity';
import { BaseGroupEntity } from '../../entity/_baseGroupEntity';
import { CharacterGroupEntity } from '../../entity/CharacterGroupEntity';
import { CharacterGroupService } from '../../services/electron/character-group.service';
import { CharacterService } from '../../services/electron/character.service';
import { CharacterEntity } from '../../entity/CharacterEntity';
import { DisplayOptions } from '../vertical-bar/vertical-bar.component';
import { NgbModal } from '@ng-bootstrap/ng-bootstrap';
import { StateService } from '../../services/state.service';
import { BaseChildEntity } from '../../entity/_baseChildEntity';
import { ConfirmationDialogService } from '../confirmation-dialog/confirmation-dialog.service';

@Component({
  selector: 'app-people',
  templateUrl: '../_baseEntityComponent.html'
})
export class PeopleComponent extends BaseEntityComponent  {

  constructor(
    _groupService: CharacterGroupService, 
    _memberService : CharacterService,
    _openProjectService: OpenProjectService, 
    _alertService: AlertService, 
    _translationService : TranslateService,
    _modalService: NgbModal,
    _stateService: StateService,
    _confirmationDialogService: ConfirmationDialogService
    ) {
    super(_groupService, 
      _memberService,
      _openProjectService, 
      _alertService,
      _translationService,
      _modalService,
      _stateService,
      _confirmationDialogService);
  }

  protected newGroup() : BaseGroupEntity {
    let group = new CharacterGroupEntity();
    group.children = [];
    return group;
  }
  protected newMember() : BaseChildEntity {
    return new CharacterEntity();
  }
  protected entityType() : ENTITY_TYPE {
    return ENTITY_TYPE.CHARACTERS;
  }
}
