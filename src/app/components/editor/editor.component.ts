import { Component, OnInit, Input } from '@angular/core';

@Component({
  selector: 'app-editor',
  templateUrl: './editor.component.html',
  styleUrls: ['./editor.component.scss']
})
export class EditorComponent implements OnInit {
  private _currentText : string;
  public editorOptions = {
    charCounterCount: true,
    theme: 'gray',
    toolbarButtons: [
      'fontFamily', 'fontSize', 
      '|', 'bold', 'italic', 'underline', 'strikeThrough', /*'subscript', 'superscript'*/, 
      '|', 'textColor', 'backgroundColor',
      '|', 'outdent', 'indent',      
      '|', 'formatOL', 'formatUL',
      '|', 'clearFormatting', 'undo', 'redo']

  }


  constructor() { }

  ngOnInit() {
  }

  @Input()
  set currentText(val : string) {
    this._currentText = val;
  }
  get currentText() {
    return this._currentText;
  }

}
