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
import { LocationService } from '../../services/electron/location.service';
import { LocationGroupService } from '../../services/electron/location-group.service';
import { LocationGroupEntity } from '../../entity/LocationGroupEntity';
import { LocationEntity } from '../../entity/LocationEntity';
import { NgbModal } from '@ng-bootstrap/ng-bootstrap';
import { DisplayOptions } from '../vertical-bar/vertical-bar.component';
import { StateService } from '../../services/state.service';


@Component({
  selector: 'app-locations',
  templateUrl: '../_baseEntityComponent.html'
})
export class LocationsComponent  extends BaseEntityComponent  {

  
  constructor(
    _groupService: LocationGroupService, 
    _memberService : LocationService,
    _openProjectService: OpenProjectService, 
    _alertService: AlertService, 
    _translationService : TranslateService,
    _modalService: NgbModal,
    _stateService: StateService
    ) {
    super(_groupService, 
      _memberService,
      _openProjectService, 
      _alertService,
      _translationService,
      _modalService,
      _stateService);
  }

  protected displayOptions() : DisplayOptions {
    return {
      showImage: true
    };
  } 


  protected newGroup() : BaseGroupEntity {
    return new LocationGroupEntity();
  }
  protected newMember(parent : LocationGroupEntity) : BaseEntity {
    let member = new LocationEntity();
    member.parent = parent;
    return member;
  }
  protected entityType() : ENTITY_TYPE {
    return ENTITY_TYPE.LOCATIONS;
  }

}
