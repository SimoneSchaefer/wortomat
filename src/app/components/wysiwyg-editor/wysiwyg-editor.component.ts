import { Component, OnInit } from '@angular/core';
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
      '|', 'clearFormatting', 'undo', 'redo', 'inlineClass'],
    inlineClasses: {
      'fr-class-todo-marker': 'mark as TODO'
    }
  }


  constructor(private _activeModal: NgbActiveModal, private _translateService: TranslateService) { }

  ngOnInit() {}

  save() {
    this._activeModal.close(this.content);
  }

  close() {
    if (confirm(this._translateService.instant("REALLY_CLOSE"))) {
      this._activeModal.dismiss('dismiss');
    }
  }

  get editorOptions() { return this._editorOptions;}
  set editorOptions(options: any) { this._editorOptions = options;};

  get content() { return this._content;}
  set content(content: string) { this._content = content; }

  get title() { return this._title;}
  set title(title: string) { this._title = title; }

}
