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
import { NgbModal } from '@ng-bootstrap/ng-bootstrap';
import { StateService } from '../../services/state.service';
import { BaseChildEntity } from '../../entity/_baseChildEntity';
import { ConfirmationDialogService } from '../confirmation-dialog/confirmation-dialog.service';

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
    let group = new BackgroundGroupEntity();
    group.children = [];
    return group;
  }
  protected newMember() : BaseChildEntity {
    return new BackgroundEntity();
  }
  entityType() : ENTITY_TYPE {
    return ENTITY_TYPE.BACKGROUNDS;
  }

}
