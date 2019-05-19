import { Component, OnInit, Input } from '@angular/core';
import { BaseEntity, ENTITY_TYPE } from '../../entity/_baseEntity';

@Component({
  selector: 'app-optional-image',
  templateUrl: './optional-image.component.html',
  styleUrls: ['./optional-image.component.scss']
})
export class OptionalImageComponent implements OnInit {
  private _css : string;
  private _baseEntity : BaseEntity;
  private _entityType : ENTITY_TYPE;

  constructor() { }

  ngOnInit() {}

  @Input('css')
  set css (css : string) {
    this._css = css;
  }
  @Input('baseEntity')
  set baseEntity (baseEntity : BaseEntity) {
    this._baseEntity = baseEntity;
  }
  @Input('entityType')
  set entityType (entityType : ENTITY_TYPE) {
    this._entityType = entityType;
  }
  get baseEntity () : BaseEntity {
    return this._baseEntity;
  }
  get css () : string {
    return this._css;
  }
  get entityType() : ENTITY_TYPE {
    return this._entityType;
  }
}
