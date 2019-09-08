import { Injectable } from '@angular/core';
import { BaseEntity } from '../entity/_baseEntity';

@Injectable({
  providedIn: 'root'
})
export class TodoCounterService {

  constructor() { }

  todoCount(content: string) {
    let subString = 'fr-class-todo-marker';
    let n = 0;
    let pos = 0;
    let step =  subString.length;
    while (true) {
        pos = content.indexOf(subString, pos);
        if (pos >= 0) {
            ++n;
            pos += step;
        } else break;
    }
    return n;
 }
}
