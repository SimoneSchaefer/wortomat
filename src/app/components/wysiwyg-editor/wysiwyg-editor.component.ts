import { Component, Input, Output, EventEmitter } from '@angular/core';
import { runInThisContext } from 'vm';

@Component({
  selector: 'app-wysiwyg-editor',
  templateUrl: './wysiwyg-editor.component.html',
  styleUrls: ['./wysiwyg-editor.component.scss']
})
export class WysiwygEditorComponent {
  @Input() content : string;
  @Output() contentChange = new EventEmitter<string>();
  editorOptions = {};

  constructor() {
    let $this = this;
    this.editorOptions = {
      charCounterCount: true,
      theme: 'gray',
      pastePlain: true,
      autofocus: true,
      toolbarButtons: [
        'fontFamily', 'fontSize', 'bold', 'italic', 'underline', 'strikeThrough',
        '|', 'textColor', 'backgroundColor',
        '|', 'formatOL', 'formatUL',
        '|', 'clearFormatting', 'undo', 'redo', 'inlineClass'],
      inlineClasses: {
        'fr-class-todo-marker': 'mark as TODO',
        'fr-class-idea-marker': 'mark as IDEA',
        'fr-class-inconsistency-marker': 'mark as INCONSISTENT',
        'fr-class-doublecheck-marker': 'mark as CHECK AGAIN',
       
      },      
      events : {
        'image.beforeUpload': function (files: Blob[]) { // makes images formatted in base64
          if (files.length > 0) {
            var reader = new FileReader();
            reader.onloadend = (e) => {
              var result =  e.target['result'];
              this.image.insert(result, null, null,this.image.get());
            }
            reader.readAsDataURL(files[0]);
            return false;
          }
        },
        'contentChanged': function () {
          $this.contentChange.emit(this.html.get());
        }
      }
    };
   }
}
