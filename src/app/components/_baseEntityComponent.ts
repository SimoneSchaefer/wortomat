import { OnInit } from '@angular/core';
import { ResponseType } from '../message/Message';
import { BaseEntity, ENTITY_TYPE } from '../entity/_baseEntity';
import { AlertService } from '../services/alert.service';
import { OpenProjectService } from '../services/open-project.service';
import { BaseService } from '../services/electron/_baseService';
import { TranslateService } from '@ngx-translate/core';
import { BaseGroupEntity } from '../entity/_baseGroupEntity';


export abstract class BaseEntityComponent implements OnInit {

  protected abstract newGroup() : BaseEntity;
  protected abstract newMember(parent : BaseGroupEntity) : BaseEntity;
  protected abstract entityType() : ENTITY_TYPE;
  

  private _entities = new Array<BaseEntity>();
  private _selectedEntity: BaseEntity;

  constructor(
      private _groupService : BaseService,
      private _memberService : BaseService, 
      private _openProjectService: OpenProjectService, 
      private _alertService: AlertService,
      private _translateService : TranslateService) {

  }

  ngOnInit() {
    this._load(true);
  }

  updateGroup(group : BaseGroupEntity) : void {
    this.save(this._groupService, group, this.entities);
  }

  updateMember(member : BaseEntity) : void {
    this.save(this._memberService, member, null, 'CHILD_');
  }

  deleteMember(member : BaseEntity) : void {
    this.delete(this._memberService, member);
  }

  deleteGroup(group : BaseGroupEntity): void {
    this.delete(this._groupService, group); 
  }

  addNewGroup() {
    this.save(this._groupService, this.newGroup(), this.entities);
  }

  addNewMember(parentEntity : BaseGroupEntity) {
    this.save(this._memberService, this.newMember(parentEntity), parentEntity['children'], 'CHILD_');
  }

  select(entity : BaseEntity) {
    this.selectedEntity = entity;
  }

  updateOrder(entities: BaseGroupEntity[]) {
    let $this = this;
    console.dir('baseEntityComponent#updateOrder');
    console.dir(entities);
    this._groupService.saveAll(entities, function(response) {
      if (response.responseType === ResponseType.SUCCESS) {
        $this._alertService.success($this.entityType().toUpperCase() + ".UPDATED") + "_SUCCESS";
        $this._loadDelayed();         
      } else {
        console.dir(response);
        $this._alertService.error($this.entityType().toUpperCase() + ".ERROR");
      }
    });

  }


  private save(baseService : BaseService, newEntity : BaseEntity, entities : BaseEntity[], prefix : string = '') {
    let $this = this;
    let newElement = (newEntity.id) ? false : true;
    if (newElement) {
      newEntity.order = $this.entities.length + 1;
    }   
    baseService.save(newEntity, function(response) {
      if (response.responseType === ResponseType.SUCCESS) {
        $this._alertService.success($this.entityType().toUpperCase() + "."+prefix+ (newElement ? "CREATED" : "UPDATED") + "_SUCCESS");
        $this._loadDelayed();         
      } else {
        $this._alertService.error($this.entityType().toUpperCase() + "."+prefix+"UNTITLED");
      }
    });
  }



  private delete(service : BaseService, entity : BaseEntity) {
    let $this = this;
    if (confirm(this._translateService.instant("REALLY_DELETE"))) {
      service.remove(entity.id, function (response) {
        if (response.responseType == ResponseType.SUCCESS) {
          $this._loadDelayed(true);         
        } else {
          $this._alertService.error(`ERROR_${response.msg}`);
        }
      });
    }
  }


  private _loadDelayed(selectFirst : boolean = false) {
    let $this = this;
    setTimeout(function() {
      $this._load(selectFirst);
    }, 500);
  }



  private _load(selectFirst : boolean = false): void {
    let $this = this;
    $this._groupService.loadAll(function (response) {
      if (response.responseType == ResponseType.SUCCESS) {
        $this.entities = response.data.entities ? response.data.entities : new Array(); 
            


        if (selectFirst) {
          $this.selectedEntity = null;
          if ($this.entities.length) {
            if ($this.entities[0]['children']&&$this.entities[0]['children'].length) {
              $this.selectedEntity = $this.entities[0]['children'][0];
            } 
          }
        }
      } else {
        $this._alertService.error(`ERROR_PROJECTS_${response.msg}`);
      }
    });
  }

  public get entities(): Array<BaseEntity> {
    return this._entities;
  }
  public set entities(val: Array<BaseEntity>) {
    this._entities = val;
  }
  get selectedEntity() {
    return this._selectedEntity;
  }
  set selectedEntity(val : BaseEntity) {
    this._selectedEntity = val;
  }
  protected get baseService(): BaseService {
    return this._groupService;
  }
  protected get alertService(): AlertService {
    return this._alertService;
  }
  protected get openProjectService(): OpenProjectService {
    return this._openProjectService;
  }
}
