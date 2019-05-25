import { Component, OnInit, Input, Output, EventEmitter, OnChanges } from '@angular/core';
import { BaseEntity, ENTITY_TYPE } from '../../entity/_baseEntity';
import { BaseGroupEntity } from '../../entity/_baseGroupEntity';
import { StateService, STATE } from '../../services/state.service';
import { CdkDragDrop, moveItemInArray, transferArrayItem } from '@angular/cdk/drag-drop';


@Component({
  selector: 'app-vertical-bar',
  templateUrl: './vertical-bar.component.html',
  styleUrls: ['./vertical-bar.component.scss']
})
export class VerticalBarComponent implements OnInit {

  private _entities: BaseEntity[];
  private _selectedEntity: BaseEntity;
  private _editingParent = new Array<number>();
  private _editingChild = new Array<number>();
  private _entityType : ENTITY_TYPE;
  private _currentValue : string;
  @Output() addNewGroup = new EventEmitter();
  @Output() addNewMember = new EventEmitter<BaseGroupEntity>();
  @Output() updateGroup = new EventEmitter<BaseGroupEntity>();
  @Output() deleteGroup = new EventEmitter<BaseGroupEntity>();
  @Output() deleteMember = new EventEmitter<BaseEntity>();
  @Output() updateMember = new EventEmitter<BaseEntity>();
  @Output() updateOrder = new EventEmitter<BaseGroupEntity[]>();

  @Output() select = new EventEmitter<BaseEntity>();

  constructor(private _stateService : StateService) { }

  ngOnInit() {
    if (this.entities.length) {
      if (this.entities[0]['children']&& this.entities[0]['children'].length) {
        this.selectedEntity = this.entities[0]['children'][0];
      }
    }
  }

  public addNewParentEntity() {
    this.addNewGroup.emit();
  }
  public addNewChildEntity(parent : BaseGroupEntity) {
    this.addNewMember.emit(parent);
  }
  public deleteParent(entity : BaseGroupEntity) {
    this.deleteGroup.emit(entity);
  }
  public deleteChild(entity : BaseEntity) {
    this.deleteMember.emit(entity);
  }
  public selectEntity(entity : BaseEntity) {
    this.select.emit(entity);
  }

  updateParentEntityName(parent: BaseGroupEntity): void {
    parent.name = this.currentValue;
    this.updateGroup.emit(parent);
    this.cancelEditingParentEntityName(parent);
  }


  cancelEditingParentEntityName(parent: BaseGroupEntity) : void {
    this._editingParent.splice(this._editingParent.indexOf(parent.id), 1);
    this.currentValue = null;
  }


  updateChildEntityName(child: BaseEntity): void {
    child.name = this.currentValue;
    this.updateMember.emit(child);
    this.cancelEditingChildEntityName(child);
  }


  cancelEditingChildEntityName(child: BaseEntity) : void {
    this._editingChild.splice(this._editingChild.indexOf(child.id), 1);
    this.currentValue = null;
  }


  editParent(parent: BaseGroupEntity) {
    if (this._editingParent.indexOf(parent.id) < 0) {
      this._editingParent.push(parent.id);
      this.currentValue = parent.name;
    }
  }


  editChild(child: BaseEntity) {
    if (this._editingChild.indexOf(child.id) < 0) {
      this._editingChild.push(child.id);
      this.currentValue = child.name;
    }
  }

  editingParent(parent: BaseGroupEntity): boolean {
    return this._editingParent.indexOf(parent.id) >= 0;
  }
  editingChild(child: BaseEntity): boolean {
    return this._editingChild.indexOf(child.id) >= 0;
  }

  inEditMode() : boolean {
    return this._editingParent.length > 0 || this._editingChild.length > 0 ;
  }

  visible(group: BaseEntity) {
    return this._stateService.getState(this.entityType, group) == STATE.EXPANDED;
  }

  toggle(group: BaseEntity) {
    this._stateService.toggleState(this.entityType, group);
  }

  dropGroup($event) {
    moveItemInArray(this._entities, $event.previousIndex, $event.currentIndex);
    this._updateOrder();
  }

  dropItem(event) {
    console.dir(event);
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

  private _updateOrder() {
    let i = 0;
    for (let entity of this._entities) {
      entity.order = i;
      i++;
      for (let j = 0; j < entity['children'].length; j++) {
        entity['children'][j].parent = entity;
        entity['children'][j].order = j;
        j++;
      }
    }
    console.log('updated order');
    console.dir(this._entities);
    this.updateOrder.emit(this._entities);
  }

  getConnectedList(): any[] {
    return this.entities.map(x => `${x.id}`);
  }


  @Input()
  set entities(value: BaseEntity[]) {
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
  get entities(): BaseEntity[] {
    return this._entities;
  }
  get entityType(): ENTITY_TYPE {
    return this._entityType;
  }
  get selectedEntity() : BaseEntity {
    return this._selectedEntity;
  }
  get currentValue() : string {
    return this._currentValue;
  }
  set currentValue(val : string) {
    this._currentValue = val;
  }
}
