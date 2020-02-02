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
import { NgbModal } from '@ng-bootstrap/ng-bootstrap';
import { StateService } from '../../services/state.service';
import { BaseChildEntity } from '../../entity/_baseChildEntity';
import { ConfirmationDialogService } from '../confirmation-dialog/confirmation-dialog.service';

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
    return new PlotlineGroupEntity();
  }
  protected newMember() : BaseChildEntity {
    return new PlotlineEntity();
  }
  entityType() : ENTITY_TYPE {
    return ENTITY_TYPE.PLOTLINES;
  }
}
