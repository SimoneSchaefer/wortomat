import { Component, OnInit, Input, Output, EventEmitter, OnChanges } from '@angular/core';
import { BaseEntity, ENTITY_TYPE } from '../../entity/_baseEntity';
import { BaseGroupEntity } from '../../entity/_baseGroupEntity';
import { StateService, STATE } from '../../services/state.service';

@Component({
  selector: 'app-vertical-bar',
  templateUrl: './vertical-bar.component.html',
  styleUrls: ['./vertical-bar.component.scss']
})
export class VerticalBarComponent implements OnInit {

  private _entities: BaseEntity[];
  private _selectedEntity: BaseEntity;
  private _editing = new Array<number>();
  private _entityType : ENTITY_TYPE;
  private _currentValue : string;
  @Output() addNewGroup = new EventEmitter();
  @Output() addNewMember = new EventEmitter<BaseGroupEntity>();
  @Output() updateGroup = new EventEmitter<BaseGroupEntity>();
  @Output() deleteGroup = new EventEmitter<BaseGroupEntity>();
  @Output() deleteMember = new EventEmitter<BaseEntity>();
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

  updateParentEntityName(parent: BaseEntity): void {
    parent.name = this.currentValue;
    this.updateGroup.emit(parent);
    this.cancelEditingParentEntityName(parent);
  }


  cancelEditingParentEntityName(parent: BaseEntity) : void {
    this._editing.splice(this._editing.indexOf(parent.id), 1);
    this.currentValue = null;
  }

  editParent(parent: BaseEntity) {
    if (this._editing.indexOf(parent.id) < 0) {
      this._editing.push(parent.id);
      this.currentValue = parent.name;
    }
  }

  editing(parent: BaseEntity): boolean {
    return this._editing.indexOf(parent.id) >= 0;
  }

  inEditMode() : boolean {
    console.dir();
    return this._editing.length > 0;
  }

  visible(group: BaseEntity) {
    return this._stateService.getState(this.entityType, group) == STATE.EXPANDED;
  }

  toggle(group: BaseEntity) {
    this._stateService.toggleState(this.entityType, group);
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
