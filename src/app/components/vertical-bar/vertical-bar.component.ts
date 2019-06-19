import { Component, OnInit, Input, Output, EventEmitter } from '@angular/core';
import { BaseEntity, ENTITY_TYPE } from '../../entity/_baseEntity';
import { BaseGroupEntity } from '../../entity/_baseGroupEntity';
import { StateService, STATE } from '../../services/state.service';
import { moveItemInArray, transferArrayItem } from '@angular/cdk/drag-drop';


@Component({
  selector: 'app-vertical-bar',
  templateUrl: './vertical-bar.component.html',
  styleUrls: ['./vertical-bar.component.scss']
})
export class VerticalBarComponent implements OnInit {

  private _entities: BaseGroupEntity[];
  private _selectedEntity: BaseEntity;
  private _entityType : ENTITY_TYPE;
  private _displayOptions: DisplayOptions;

  @Output() addNewGroup = new EventEmitter();
  @Output() addNewMember = new EventEmitter<BaseGroupEntity>();
  @Output() updateGroup = new EventEmitter<BaseGroupEntity>();
  @Output() deleteGroup = new EventEmitter<BaseGroupEntity>();
  @Output() deleteMember = new EventEmitter<BaseEntity>();
  @Output() updateMember = new EventEmitter<BaseEntity>();
  @Output() updateOrder = new EventEmitter<BaseGroupEntity[]>();
  @Output() select = new EventEmitter<BaseEntity>();

  constructor(private _stateService : StateService) { }

  ngOnInit() {}

  /**
   * Checks if a group is currently visible (expanded)
   * 
   * @param group 
   */
  visible(group: BaseEntity) {
    return this._stateService.getState(this.entityType, group) == STATE.EXPANDED;
  }

  /**
   * Toggle a groups visiblity
   * 
   * @param group 
   */
  toggle(group: BaseEntity) {
    this._stateService.toggleState(this.entityType, group);
  }


  /**
   * Called on drop of a group element
   * 
   * @param $event 
   */
  dropGroup($event) {
    moveItemInArray(this._entities, $event.previousIndex, $event.currentIndex);
    this._updateOrder();
  }


  /**
   * Called on drop of a child element
   * 
   * @param event 
   */
  dropItem(event) {
    if (event.previousContainer === event.container) {
      moveItemInArray(event.container.data, event.previousIndex, event.currentIndex);
    } else {
      transferArrayItem(event.previousContainer.data,
        event.container.data,
        event.previousIndex,
        event.currentIndex);
    }
    this._updateOrder();
  }

  /**
   * Needed to support nested lists in angularMaterial drag-and-drop
   */
  getConnectedList(): any[] {
    return this.entities.map(x => `${x.id}`);
  }

  ///////////////////////////////
  ///////////EVENTS//////////////
  ///////////////////////////////
  public onParentUpdate(parent : BaseGroupEntity) {
    this.updateGroup.emit(parent);
  }
  public onParentDelete(parent : BaseGroupEntity) {
    this.deleteGroup.emit(parent);
  }
  public onChildUpdate(child : BaseEntity) {
    this.updateMember.emit(child);
  }
  public onChildDelete(entity : BaseEntity) {
    this.deleteMember.emit(entity);
  }
  public onNewChild(parent: BaseGroupEntity) {
    this.addNewMember.emit(parent);
  }
  public addNewParentEntity() {
    this.addNewGroup.emit();
  }
  public selectEntity(entity : BaseEntity) {
    console.log('select ' + entity.name);
    this.select.emit(entity);
  }


  /**
   * Update the "order" flag of the entities and their children
   * according to the current order in the array. 
   */
  private _updateOrder() {
    let i = 0;
    for (let entity of this._entities) {
      entity.order = i;
      i++;
      for (let j = 0; j < entity['children'].length; j++) {        
        entity['children'][j].parent = entity;
        entity['children'][j].order = j;
      }
    }
    this.updateOrder.emit(this._entities);
  }




  //////////////////////////////////////
  ///////////GETTER/SETTER//////////////
  //////////////////////////////////////  
  @Input()
  set displayOptions(value: DisplayOptions) {
    this._displayOptions = value;
  }
  @Input()
  set entities(value: BaseGroupEntity[]) {
    this._entities = value;
  }
  @Input()
  set entityType(value: ENTITY_TYPE) {
    this._entityType = value;
  }
  @Input()
  set selectedEntity(value: BaseEntity) {
    this._selectedEntity = value;
  }
  get entities(): BaseGroupEntity[] {
    return this._entities;
  }
  get entityType(): ENTITY_TYPE {
    return this._entityType;
  }
  get selectedEntity() : BaseEntity {
    return this._selectedEntity;
  }
  get displayOptions() : DisplayOptions {
    return this._displayOptions;
  }
}

export class DisplayOptions {
  showImage : boolean;
}
