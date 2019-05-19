import { Component, OnInit, Input } from '@angular/core';
import { ImageResult, ResizeOptions } from 'ng2-imageupload';
import { BaseEntity, ENTITY_TYPE } from '../../entity/_baseEntity';


@Component({
  selector: 'app-image-upload',
  templateUrl: './image-upload.component.html',
  styleUrls: ['./image-upload.component.scss']
})
export class ImageUploadComponent implements OnInit {
  private _baseEntity : BaseEntity;
  private _entityType : ENTITY_TYPE;
  
  private _resizeOptions: ResizeOptions = {
    resizeMaxHeight: 500,
    resizeMaxWidth: 500
  };


  constructor() { }

  ngOnInit() {}

  selected(imageResult: ImageResult) {
    this.baseEntity.image = imageResult.resized
      && imageResult.resized.dataURL
      || imageResult.dataURL;
  }

  get resizeOptions () : ResizeOptions {
    return this._resizeOptions;
  }
  get baseEntity () : BaseEntity {
    return this._baseEntity;
  }
  get entityType () : ENTITY_TYPE {
    return this._entityType;
  }
  @Input('baseEntity')
  set baseEntity (baseEntity : BaseEntity) {
    this._baseEntity = baseEntity;
  }
  @Input('entityType')
  set entityType (entityType : ENTITY_TYPE) {
    console.log('entityType is ' + entityType);
    this._entityType = entityType;
  }
}

