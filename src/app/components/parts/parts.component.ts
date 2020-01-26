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
import { StateService } from '../../services/state.service';
import { PlotlineService } from '../../services/electron/plotline.service';
import { CharacterService } from '../../services/electron/character.service';
import { LocationService } from '../../services/electron/location.service';
import { ResponseType } from '../../message/Message';
import { PlotlineEntity } from '../../entity/PlotlineEntity';
import { CharacterEntity } from '../../entity/CharacterEntity';
import { LocationEntity } from '../../entity/LocationEntity';


export enum GroupTypes {
  PARTS = 'PARTS',
  PLOTLINES = 'PLOTLINES',
  CHARACTERS = 'CHARACTERS',
  LOCATIONS = 'LOCATIONS',
  TIME = 'TIME'
}

@Component({
  selector: 'app-parts',
  templateUrl: '../_baseEntityComponent.html'
})
export class PartsComponent extends BaseEntityComponent  {

  availablePlotlines: PlotlineEntity[] = [];
  availableCharacters: CharacterEntity[] = [];
  availableLocations: LocationEntity[] = [];

  selectedPlotlines: PlotlineEntity[] = [];
  selectedCharacters: CharacterEntity[] = [];
  selectedLocations: LocationEntity[] = [];

  groupBy : GroupTypes = GroupTypes.PARTS;

  constructor(
    _groupService: PartService, 
    _memberService : ChapterService,
    _openProjectService: OpenProjectService, 
    _alertService: AlertService, 
    _translationService : TranslateService,
    _modalService: NgbModal,
    _stateService: StateService,
    private _plotlineService: PlotlineService,
    private _characterService: CharacterService,
    private _locationService: LocationService


    ) {
    super(_groupService, 
      _memberService,
      _openProjectService, 
      _alertService,
      _translationService,
      _modalService,
      _stateService);


    let $this = this;
    this._plotlineService.loadAll(function(response) {
      if (response.responseType == ResponseType.SUCCESS) {
        $this.availablePlotlines = response.data.entities ? response.data.entities : new Array(); 
        $this.selectedPlotlines.push(...$this.availablePlotlines);
        console.log('selected', $this.selectedPlotlines);
      }
    });
    this._characterService.loadAll(function(response) {
      if (response.responseType == ResponseType.SUCCESS) {
        $this.availableCharacters = response.data.entities ? response.data.entities : new Array(); 
      }
    });
    this._locationService.loadAll(function(response) {
      if (response.responseType == ResponseType.SUCCESS) {
        $this.availableLocations = response.data.entities ? response.data.entities : new Array(); 
      }
    });
  }

  isVisible(entity) {

  }

  


  protected newGroup() : BaseGroupEntity {
    let part = new PartEntity();
    part.children = [];
    return part;
  }
  protected newMember(parent : PartEntity) : BaseEntity {
    let member = new ChapterEntity();
    member.date = new Date();
    member.parent = parent;
    return member;
  }
  protected entityType() : ENTITY_TYPE {
    return ENTITY_TYPE.PARTS;
  }
}
