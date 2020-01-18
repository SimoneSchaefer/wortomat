import { Component, OnInit, Input, Output, EventEmitter } from '@angular/core';
import { BaseEntity, ENTITY_TYPE } from '../../entity/_baseEntity';
import { BaseGroupEntity } from '../../entity/_baseGroupEntity';
import { StateService } from '../../services/state.service';
import { moveItemInArray, transferArrayItem } from '@angular/cdk/drag-drop';
import { TodoCounterService } from '../../services/todo-counter.service';


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

  @Output() updateOrder = new EventEmitter<BaseGroupEntity[]>();
  @Output() select = new EventEmitter<BaseEntity>();
  @Output() edit = new EventEmitter<BaseEntity>();
  @Output() write = new EventEmitter<BaseEntity>();
  @Output() delete = new EventEmitter<BaseEntity>();
  @Output() add = new EventEmitter<BaseEntity>();

  constructor(private _stateService : StateService, private _todoCounter : TodoCounterService) { }

  ngOnInit() {}

  /**
   * Checks if a group is currently visible (expanded)
   * 
   * @param group 
   */
  visible(group: BaseEntity) {
    return this._stateService.entityCollapsed(this.entityType, group);
  }

  /**
   * Toggle a groups visiblity
   * 
   * @param group 
   */
  toggle(group: BaseEntity) {
    this._stateService.toggleItemCollapseState(this.entityType, group);
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
    console.log('dropped item');
    if (event.previousContainer === event.container) {
      console.log('same container');
      moveItemInArray(event.container.data, event.previousIndex, event.currentIndex);
    } else {
      console.log('different container');
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

  isSelected(entity: BaseEntity) {
    return (this.selectedEntityIsParent() === this.entityIsParent(entity)) && this.selectedEntity.id === entity.id;
  }

  selectedEntityIsParent() {
    return this.selectedEntity && this.entityIsParent(this.selectedEntity);
  }

  entityIsParent(entity: BaseEntity) {
    return 'children' in entity;
  }

  todoCount(entity: BaseEntity) {
    return this._todoCounter.todoCount(entity.notes? entity.notes : '');
  }
  
  ideaCount(entity: BaseEntity) {
     return this._todoCounter.ideaCount(entity.notes? entity.notes : '');
  }

  inconsistencyCount(entity: BaseEntity) {
    return this._todoCounter.inconsistencyCount(entity.notes? entity.notes : '');
  }

  doublecheckCount(entity: BaseEntity) {
       return this._todoCounter.doublecheckCount(entity.notes? entity.notes : '');
  }






  ///////////////////////////////
  ///////////EVENTS//////////////
  ///////////////////////////////
  public selectEntity(entity : BaseEntity) {
    if (this.entityIsParent(entity) && !this.visible(entity)) {
      this.toggle(entity);
    }
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
