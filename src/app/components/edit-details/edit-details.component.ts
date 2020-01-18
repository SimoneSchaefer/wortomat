import { Component, OnInit } from '@angular/core';
import { NgbActiveModal } from '@ng-bootstrap/ng-bootstrap';
import { TranslateService } from '@ngx-translate/core';
import { BaseEntity, Status } from '../../entity/_baseEntity';
import { STATUS_CODES } from 'http';

@Component({
  selector: 'app-edit-details',
  templateUrl: './edit-details.component.html',
  styleUrls: ['./edit-details.component.scss']
})
export class EditDetailsComponent implements OnInit {
  private _baseEntity : BaseEntity;
  private _title: string;
  private _displayOptions;
  private _entityType : string;

  private _editorOptions = {
    charCounterCount: true,
    theme: 'gray',
    toolbarButtons: [
      'fontFamily', 'fontSize', 
      '|', 'bold', 'italic', 'underline', 'strikeThrough',
      '|', 'textColor', 'backgroundColor',
      '|', 'formatUL',
      '|', 'clearFormatting', 'undo', 'redo']

  }
  constructor(private _activeModal: NgbActiveModal, private _translateService: TranslateService) { }


  ngOnInit() {}

  save() {
    this._activeModal.close(this.baseEntity);
  }

  close() {
    if (confirm(this._translateService.instant("REALLY_CLOSE"))) {
      this._activeModal.dismiss("dismiss");
    }
  }

  active(baseEntity, status) {
    let active = ''+baseEntity.status === status;
    if (active) console.log('active', status);
    return active;
  }

  toggleStatus($event) {
    console.log($event);
  }

  getStatus() {
    return Object.keys(Status).filter(key => parseInt(key, 10) >= 0).map(key => parseInt(key, 10));
  }

  get displayOptions() {return this._displayOptions;}
  set displayOptions(options: any) {this._displayOptions = options;};

  get editorOptions() {return this._editorOptions;}
  set editorOptions(options: any) {this._editorOptions = options;};

  get baseEntity() {return this._baseEntity}
  set baseEntity(baseEntity: BaseEntity) { this._baseEntity = baseEntity}

  get entityType() { return this._entityType;}
  set entityType(entityType: string) {this._entityType = entityType;}

  get title() { return this._title; }
  set title(title: string) { this._title = title; }
}
