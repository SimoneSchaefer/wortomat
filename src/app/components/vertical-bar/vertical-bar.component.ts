import { Component, OnInit, Input, Output, EventEmitter, OnChanges } from '@angular/core';
import { BaseEntity, ENTITY_TYPE } from '../../entity/_baseEntity';
import { BaseGroupEntity } from '../../entity/_baseGroupEntity';
import { StateService, STATE } from '../../services/state.service';

@Component({
  selector: 'app-vertical-bar',
  templateUrl: './vertical-bar.component.html',
  styleUrls: ['./vertical-bar.component.scss']
})
export class VerticalBarComponent implements OnInit, OnChanges {

  private _entities: BaseEntity[];
  private _selectedEntity: BaseEntity;
  private _editing = new Array<number>();
  private _entityType : ENTITY_TYPE;
  @Output() addNewGroup = new EventEmitter();
  @Output() addNewMember = new EventEmitter<BaseGroupEntity>();
  @Output() updateParentName = new EventEmitter();
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
  ngOnChanges() {
    console.log('something changed!');
    console.dir(this._entities);
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
    this.updateParentName.emit(parent);
   // this._editing.splice(this._editing.indexOf(parent.id), 1);
   // let $this = this;
    /*$this.parentService.save(parent, function (response) {
      console.dir(response);
      $this.init();
    });*/
  }



  edit(parent: BaseEntity) {
    if (this._editing.indexOf(parent.id) < 0) {
      this._editing.push(parent.id);
    }
  }

  editing(parent: BaseEntity): boolean {
    return this._editing.indexOf(parent.id) >= 0;
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
}
