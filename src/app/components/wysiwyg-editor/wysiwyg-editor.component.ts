import { Component, OnInit, Output, EventEmitter } from '@angular/core';
import FroalaEditor from 'froala-editor';
import { NgbActiveModal } from '@ng-bootstrap/ng-bootstrap';
import { TranslateService } from '@ngx-translate/core';

@Component({
  selector: 'app-wysiwyg-editor',
  templateUrl: './wysiwyg-editor.component.html',
  styleUrls: ['./wysiwyg-editor.component.scss']
})
export class WysiwygEditorComponent implements OnInit {
  private _content : string;
  private _title: string;
  private _editorOptions = {
    charCounterCount: true,
    theme: 'gray',
    toolbarButtons: [
      'fontFamily', 'fontSize', 
      '|', 'bold', 'italic', 'underline', 'strikeThrough',
      '|', 'textColor', 'backgroundColor',
      '|', 'formatOL',
      '|', 'clearFormatting', 'undo', 'redo', 'todo']

  }


  constructor(private _activeModal: NgbActiveModal, private _translateService: TranslateService) { }

  ngOnInit() {
    FroalaEditor.DefineIcon('todo', {NAME: 'paint-brush'});
    FroalaEditor.RegisterCommand('todo', {
      title: 'Mark as TODO',
      focus: false,
      undo: false,
      refreshAfterCallback: false,
      icon: 'todo',
      callback: function(bla) {
         if (bla === 'todo') {
          this.colors.background('#ffff00');
          this.colors.text('#ff0000');
        }
      }
    });
  }

  save() {
    this._activeModal.close(this.content);
  }

  close() {
    if (confirm(this._translateService.instant("REALLY_CLOSE"))) {
      this._activeModal.dismiss();
    }
  }

  get editorOptions() {
    return this._editorOptions;
  }

  set editorOptions(options: any) {
    this._editorOptions = options;
  };

  get content() {
    return this._content;
  }

  set content(content: string) {
    this._content = content;
  }

  get title() {
    return this._title;
  }

  set title(title: string) {
    this._title = title;
  }

}
