import { OnInit } from '@angular/core';
import { ResponseType } from '../message/Message';
import { BaseEntity, ENTITY_TYPE } from '../entity/_baseEntity';
import { AlertService } from '../services/alert.service';
import { OpenProjectService } from '../services/open-project.service';
import { BaseService } from '../services/electron/_baseService';
import { TranslateService } from '@ngx-translate/core';
import { BaseGroupEntity } from '../entity/_baseGroupEntity';
import { DisplayOptions } from './vertical-bar/vertical-bar.component';


export abstract class BaseEntityComponent implements OnInit {

  protected abstract newGroup() : BaseEntity;
  protected abstract newMember(parent : BaseGroupEntity) : BaseEntity;
  protected abstract entityType() : ENTITY_TYPE;
  

  private _entities = new Array<BaseEntity>();
  private _selectedEntity: BaseEntity;
  private _editorOpen : boolean;
  private _currentNotes : string;
  private _detailsOpen : boolean;
  private _currentNameValue : string;
  private _currentSummaryValue : string;
  private _currentDetailedSummaryValue : string;

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

  protected displayOptions() : DisplayOptions {
    return {
      showImage: false
    };
  }

  getContent() : string {
    if (this.selectedEntityIsParent()) {
      let content = '';
      for (let child of this.selectedEntity['children']) {
        content += '<h4 class="text-muted">'+(child.name ? child.name : '')+'</h4>';
        content += child.notes ? child.notes : '';
      }
      return content;
    }
    return this.selectedEntity.notes;
  }
    
  selectedEntityIsParent() {
    return this.selectedEntity && 'children' in this.selectedEntity;
  }
  
  
  startEditDetails() {
    this.currentNameValue = this.selectedEntity.name;
    this.currentSummaryValue = this.selectedEntity.summary;
    this.currentDetailedSummaryValue = this.selectedEntity.detailedSummary;
    this.detailsOpen = true;
  }

  update() {
    this.selectedEntity.name = this.currentNameValue;
    this.selectedEntity.summary = this.currentSummaryValue;
    this.selectedEntity.detailedSummary = this.currentDetailedSummaryValue;
    if (this.selectedEntityIsParent()) {
      this.updateGroup(this.selectedEntity as BaseGroupEntity);
    } else {
      this.updateMember(this.selectedEntity);
    }
    this.cancelUpdate();
  }

  cancelUpdate() {
    this.detailsOpen = false;
    this.currentNameValue = null;
    this.currentSummaryValue = null;
    this.currentDetailedSummaryValue = null;
  }

 saveAndCloseEditor () : void {
   this._selectedEntity.notes = this._currentNotes;
   this.updateMember(this._selectedEntity);
   this.closeEditor();
 }

  closeEditor() : void {
    this._editorOpen = false;
    this._currentNotes = "";
  }

  continueWriting() : void {
    this._editorOpen = true;
    this._currentNotes = this.selectedEntity.notes;
  }

  updateGroup(group : BaseGroupEntity) : void {
    this.save(this._groupService, group, this.entities);
  }

  updateMember(member : BaseEntity) : void {
    this.save(this._memberService, member, null, 'CHILD_');
  }

  deleteEntity(): void {
    if (this.selectedEntityIsParent()) {
      this.deleteGroup(this.selectedEntity as BaseGroupEntity);
    } else {
      this.deleteMember(this.selectedEntity);
    }
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
    this._groupService.saveAll(entities, function(response) {
      if (response.responseType === ResponseType.SUCCESS) {
        //$this._alertService.success($this.entityType().toUpperCase() + ".UPDATED") + "_SUCCESS";
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
      $this._selectedEntity = response.data.entity;
      if (response.responseType === ResponseType.SUCCESS) {
        //$this._alertService.success($this.entityType().toUpperCase() + "."+prefix+ (newElement ? "CREATED" : "UPDATED") + "_SUCCESS");
        $this._loadDelayed(false, newElement ? $this.startEditDetails : null);                
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


  private _loadDelayed(selectFirst : boolean = false, callback = null) {
    let $this = this;
    setTimeout(function() {
      $this._load(selectFirst, callback);
    }, 500);
  }

  private _load(selectFirst : boolean = false, callback = null): void {
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
        if (callback) {
          callback.apply($this);
        }
      } else {
        $this._alertService.error(`ERROR_PROJECTS_${response.msg}`);
      }
    });
  }

  get entities(): Array<BaseEntity> {
    return this._entities;
  }
  set entities(val: Array<BaseEntity>) {
    this._entities = val;
  }
  get selectedEntity() : BaseEntity {
    return this._selectedEntity;
  }
  get currentNotes() : string {
    return this._currentNotes;
  }
  set currentNotes(val: string) {
    this._currentNotes = val;
  }
  set selectedEntity(val : BaseEntity) {
    this._selectedEntity = val;
  }
  get editorOpen() : boolean {
    return this._editorOpen;
  }
  get currentNameValue() {
    return this._currentNameValue;
  }
  get currentSummaryValue() {
    return this._currentSummaryValue;
  }
  get currentDetailedSummaryValue() {
    return this._currentDetailedSummaryValue;
  }
  get detailsOpen() {
    return this._detailsOpen;
  }
  set currentSummaryValue(val : string) {
    this._currentSummaryValue = val;
  }
  set currentDetailedSummaryValue(val : string) {
    this._currentDetailedSummaryValue = val;
  }
  set currentNameValue(val : string) {
    this._currentNameValue = val;
  }
  set detailsOpen(val : boolean) {
    this._detailsOpen = val;
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
