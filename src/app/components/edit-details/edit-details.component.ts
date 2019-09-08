import { Component, OnInit } from '@angular/core';
import FroalaEditor from 'froala-editor';
import { NgbActiveModal } from '@ng-bootstrap/ng-bootstrap';
import { TranslateService } from '@ngx-translate/core';

@Component({
  selector: 'app-edit-details',
  templateUrl: './edit-details.component.html',
  styleUrls: ['./edit-details.component.scss']
})
export class EditDetailsComponent implements OnInit {
  private _name : string;
  private _summary : string;
  private _detailedSummary : string;
  private _title: string;

  private _editorOptions = {
    charCounterCount: true,
    theme: 'gray',
    toolbarButtons: [
      'fontFamily', 'fontSize', 
      '|', 'bold', 'italic', 'underline', 'strikeThrough',
      '|', 'textColor', 'backgroundColor',
      '|', 'formatOL',
      '|', 'clearFormatting', 'undo', 'redo']

  }
  constructor(private _activeModal: NgbActiveModal, private _translateService: TranslateService) { }


  ngOnInit() {}

  save() {
    this._activeModal.close({
      'name' : this.name,
      'summary' : this.summary,
      'detailedSummary' : this.detailedSummary
    });
  }

  close() {
    if (confirm(this._translateService.instant("REALLY_CLOSE"))) {
      this._activeModal.dismiss("dismiss");
    }
  }

  get editorOptions() {return this._editorOptions;}
  set editorOptions(options: any) {this._editorOptions = options;};

  get name() { return this._name;}
  set name(name: string) {this._name = name;}

  get summary() {return this._summary;}
  set summary(summary: string) {this._summary = summary;}

  get detailedSummary() {return this._detailedSummary;}
  set detailedSummary(detailedSummary: string) {this._detailedSummary = detailedSummary;}

  get title() { return this._title; }
  set title(title: string) { this._title = title; }

}
