import { Injectable } from '@angular/core';
import { BaseEntity } from '../entity/_baseEntity';

@Injectable({
  providedIn: 'root'
})
export class TodoCounterService {

  constructor() { }

  todoCount(content: string) {
    return this.count('fr-class-todo-marker', content);    
  }
  ideaCount(content: string) {
    return this.count('fr-class-idea-marker', content);    
  }
  inconsistencyCount(content: string) {
    return this.count('fr-class-inconsistency-marker', content);    
  }
  doublecheckCount(content: string) {
    return this.count('fr-class-doublecheck-marker', content);    
  }


 private count(clazz: string, content: string ) {
  let n = 0;
  let pos = 0;
  let step =  clazz.length;
  while (true) {
      pos = content.indexOf(clazz, pos);
      if (pos >= 0) {
          ++n;
          pos += step;
      } else break;
  }
  return n;
 }
}
