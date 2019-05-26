import { Component, OnInit, Input, Output, EventEmitter } from '@angular/core';
import { ENTITY_TYPE, BaseEntity } from '../../entity/_baseEntity';

@Component({
  selector: 'app-inline-edit',
  templateUrl: './inline-edit.component.html',
  styleUrls: ['./inline-edit.component.scss']
})
export class InlineEditComponent implements OnInit {
  private _entity : BaseEntity;
  private _entityType : ENTITY_TYPE;
  private _isChild : boolean;
  @Output()
  private onUpdate = new EventEmitter<BaseEntity>();
  @Output()
  private onNewChild = new EventEmitter<BaseEntity>();
  @Output()
  private onDelete = new EventEmitter<BaseEntity>();
  private _editing : boolean;
  private _currentNameValue : string;
  private _currentSummaryValue : string;


  constructor() { }

  ngOnInit() {}

  startEdit() {
    this.currentNameValue = this.entity.name;
    this.currentSummaryValue = this.entity.summary;
    this.editing = true;
  }

  update() {
    this.entity.name = this.currentNameValue;
    this.entity.summary = this.currentSummaryValue;
    this.onUpdate.emit(this.entity);
    this.cancelUpdate();
  }

  cancelUpdate() {
    this.editing = false;
    this.currentNameValue = null;
    this.currentSummaryValue = null;
  }

  addNewChild() {
    this.onNewChild.emit(this.entity);
  }

  delete() {
    console.log('delete');
    this.onDelete.emit(this.entity);
  }



  get currentNameValue() {
    return this._currentNameValue;
  }
  get currentSummaryValue() {
    return this._currentSummaryValue;
  }
  get editing() {
    return this._editing;
  }
  get entity() {
    return this._entity;
  }
  get entityType() {
    return this._entityType;
  }
  get isChild() {
    return this._isChild;
  }
  set currentSummaryValue(val : string) {
    this._currentSummaryValue = val;
  }
  set currentNameValue(val : string) {
    this._currentNameValue = val;
  }
  set editing(val : boolean) {
    this._editing = val;
  }
  @Input()
  set entity(val : BaseEntity) {
    this._entity = val;
  }
  @Input()
  set entityType(val : ENTITY_TYPE) {
    this._entityType = val;
  }
  @Input()
  set isChild(val : boolean) {
    this._isChild = val;
  }
}
