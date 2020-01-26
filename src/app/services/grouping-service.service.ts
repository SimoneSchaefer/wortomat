import { Injectable } from '@angular/core';
import { BaseEntity } from 'typeorm';
import { GroupTypes } from '../components/parts/parts.component';
import { BaseGroupEntity } from '../entity/_baseGroupEntity';

@Injectable({
  providedIn: 'root'
})
export class GroupingServiceService {

  constructor() { }


  // entities: parents with children
  group(entities: BaseGroupEntity[], groupBy: GroupTypes) {
    const newGroups = [];
    if (groupBy === GroupTypes.PARTS) {
      newGroups.push(...entities);
      return newGroups;
    }

    const allChildren = this.allChildren(entities);

    //sort by time
    if (groupBy === GroupTypes.TIME) {
      allChildren.sort((a,b) => (a.date > b.date) ? 1 : ((b.date > a.date) ? -1 : 0)); 
      return [{
        id: -1,
        children: allChildren
      }];    
    }

    //group by plotline
    if (groupBy === GroupTypes.PLOTLINES) {
      
    }


  }



  private allChildren(entities: BaseGroupEntity[]) {
    const allChildren = [];
    for (let p of entities) {
      allChildren.push(...p.children);
    }
    return allChildren;
  }
}
