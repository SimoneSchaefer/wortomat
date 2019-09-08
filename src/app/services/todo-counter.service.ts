import { Injectable } from '@angular/core';
import { BaseEntity } from '../entity/_baseEntity';

@Injectable({
  providedIn: 'root'
})
export class TodoCounterService {

  constructor() { }

  todoCount(content: string) {
    let subString = '<span style="background-color: rgb(255, 255, 0); color: rgb(255, 0, 0);">';
    let n = 0;
    let pos = 0;
    let step =  subString.length;
    while (true) {
        pos = content.indexOf(subString, pos);
        if (pos >= 0) {
            ++n;
            pos += step;
            //ignore empty tags
            if (content.substring(pos, pos + 7) == "</span>") {
              n--;
            }
        } else break;
    }
    return n;
 }
}
