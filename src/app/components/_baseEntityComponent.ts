import { OnInit } from '@angular/core';
import { ResponseType } from '../message/Message';
import { BaseEntity, ENTITY_TYPE } from '../entity/_baseEntity';
import { AlertService } from '../services/alert.service';
import { OpenProjectService } from '../services/open-project.service';
import { BaseService } from '../services/electron/_baseService';
import { TranslateService } from '@ngx-translate/core';
import { BaseGroupEntity } from '../entity/_baseGroupEntity';
import { DisplayOptions } from './vertical-bar/vertical-bar.component';
import { NgbModal } from '@ng-bootstrap/ng-bootstrap';
import { EditDetailsComponent } from './edit-details/edit-details.component';
import { BaseChildEntity } from '../entity/_baseChildEntity';
import { StateService, DISPLAY_ITEM, } from '../services/state.service';


export abstract class BaseEntityComponent implements OnInit {

  protected abstract newGroup() : BaseEntity;
  protected abstract newMember() : BaseChildEntity;
  protected abstract entityType() : ENTITY_TYPE;

  selectedDisplayContent: Array<DISPLAY_ITEM> = [];

  private _entities = new Array<BaseEntity>();
  private _selectedEntity: BaseEntity;


   constructor(
      private _groupService : BaseService,
      private _memberService : BaseService, 
      private _openProjectService: OpenProjectService, 
      private _alertService: AlertService,
      private _translateService : TranslateService,
      private _modalService: NgbModal,
      private _stateService: StateService) {
  }

  ngOnInit() { 
    this._load(true); 
    if (this.showSummary()) this.selectedDisplayContent.push('summary');
    if (this.showExtendedSummary()) this.selectedDisplayContent.push('extended_summary');
    if (this.showContent()) this.selectedDisplayContent.push('content');
  }

  protected displayOptions() : DisplayOptions {
    return {
      showImage: false
    };
  } 


  resetView() {
    if (this.showSummary()) this._stateService.toggleDisplayItemState(this.entityType(), 'summary');
    if (this.showExtendedSummary()) this._stateService.toggleDisplayItemState(this.entityType(), 'extended_summary');
    if (this.showContent()) this._stateService.toggleDisplayItemState(this.entityType(), 'content');

  }
  toggleView(type) {
    this._stateService.toggleDisplayItemState(this.entityType(), type.value ? type.value : type);
  }
      
  editDetails(entity) {
    if (!entity) {
      entity = this.selectedEntity;      
    }
    this.selectedEntity = entity;
    const modalRef = this._modalService.open(EditDetailsComponent, {size: 'lg', backdrop: 'static', keyboard : false});
    modalRef.componentInstance.baseEntity = entity;
    modalRef.componentInstance.entityType = this.entityType();
    modalRef.componentInstance.displayOptions = this.displayOptions();
    modalRef.result.then(entity => {
      this.selectedEntity = entity;
      if (this.selectedEntityIsParent()) {
        this.updateGroup(this.selectedEntity as BaseGroupEntity);
      } else {
        this.updateMember(this.selectedEntity);
      }
    }).catch((error) => {
      if (error === 'delete') {
        this.deleteEntity(entity);
      } else if (error !== 'dismiss') this.alertService.error('SAVE_ERROR')
    });
  }

  entityIsParent(entity) {
    return entity && 'children' in entity;
  }


  selectedEntityIsParent() {
    return this.selectedEntity && 'children' in this.selectedEntity;
  }  

  updateGroup(group : BaseGroupEntity) : void {
    this.save(this._groupService, group);
  }

  updateMember(member : BaseEntity) : void {
    this.save(this._memberService, member, 'CHILD_');
  }

  addNewGroup() {
    let newGroup = this.newGroup();
    this.editDetails(newGroup);
  }

  addNewMember(parentEntity : BaseGroupEntity) {
    let newMember = this.newMember();
    newMember.parent = parentEntity;
    this.editDetails(newMember);    
  }

  select(entity : BaseEntity) { this.selectedEntity = entity; }

 
  deleteEntity(entity) {
    const $this = this;
    if (confirm(this._translateService.instant("REALLY_DELETE"))) {
      let service = this.entityIsParent(entity) ? this._groupService : this._memberService;
      service.remove(entity.id, function (response) {
        if (response.responseType == ResponseType.SUCCESS) {
          $this._loadDelayed(true);         
        } else {
          $this._alertService.error(`ERROR_${response.msg}`);
        }
      });
    }
  }

  updateOrder(entities: BaseGroupEntity[]) {
    let $this = this;
    this._groupService.saveAll(entities, function(response) {
      if (response.responseType === ResponseType.SUCCESS) {
        $this._loadDelayed();         
      } else {
        $this._alertService.error($this.entityType().toUpperCase() + ".ERROR");
      }
    });
  }

  getChildren(): BaseEntity[] {
    if (this.selectedEntityIsParent()) {
      return this.selectedEntity['children'];
    }
    return [this.selectedEntity];
  }

  getContent() : string {
    if (this.selectedEntityIsParent()) {
      let content = '';
      for (let child of this.selectedEntity['children']) {
        content += '<h4 class="text-muted">'+(child.name ? child.name : '')+'</h4>';
        content += this.getContentForChild(child);
      }
      return content;
    }
    return this.getContentForChild(this.selectedEntity as BaseChildEntity);;
  }

  showSummary() : boolean {
    return this._stateService.showItem(this.entityType(), 'summary');
  }

  showExtendedSummary() : boolean {
    return this._stateService.showItem(this.entityType(), 'extended_summary');
  }

  showContent(): boolean {
    return this._stateService.showItem(this.entityType(), 'content');
  }

  private getContentForChild(child: BaseChildEntity) {
    let content = '';
    if (this._stateService.showItem(this.entityType(), 'summary')) {
      content += `<b>${child.summary || ''}</b>`;
    }
    if (this._stateService.showItem(this.entityType(), 'extended_summary')) {
      content += `<i>${child.detailedSummary || ''}</i><hr>`;
    }
    if (this._stateService.showItem(this.entityType(), 'content')) {
      content += child.notes || '';
    }
    return content;
  }

  private save(baseService : BaseService, newEntity : BaseEntity, prefix : string = '') {
    let $this = this;
    let newElement = (newEntity.id) ? false : true;
    if (newElement) {
      newEntity.order = $this.entities.length + 1;
    }   
    baseService.save(newEntity, function(response) {
      if (response.responseType === ResponseType.SUCCESS) {
        $this._selectedEntity = response.data.entity;
        $this._loadDelayed(false);                
      } else {
        $this._alertService.error($this.entityType().toUpperCase() + "."+prefix+"UNTITLED");
      }
    });
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
        if (selectFirst) { $this._selectFirst(); } 
        if (callback) { callback.apply($this); }
      } else { $this._alertService.error(`ERROR_PROJECTS_${response.msg}`); }
    });
  }

  private _selectFirst() {
    let $this = this;
    $this.selectedEntity = null;
    if ($this.entities.length) {
      if ($this.entities[0]['children']&&$this.entities[0]['children'].length) {
        $this.selectedEntity = $this.entities[0]['children'][0];
      } else {
        $this.selectedEntity = $this.entities[0];
      }
    }
  }

  get entities(): Array<BaseEntity> { return this._entities;}
  set entities(val: Array<BaseEntity>) {this._entities = val;}

  get selectedEntity() : BaseEntity { return this._selectedEntity; }
  set selectedEntity(val : BaseEntity) {this._selectedEntity = val;}

  protected get baseService(): BaseService { return this._groupService; }
  protected get alertService(): AlertService { return this._alertService; }
  protected get openProjectService(): OpenProjectService {return this._openProjectService;}
}
