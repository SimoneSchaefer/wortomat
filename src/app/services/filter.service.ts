import { Injectable } from '@angular/core';
import { PlotlineEntity } from '../entity/PlotlineEntity';
import { CharacterEntity } from '../entity/CharacterEntity';
import { LocationEntity } from '../entity/LocationEntity';
import { BaseGroupEntity } from '../entity/_baseGroupEntity';
import { PartEntity } from '../entity/PartEntity';

@Injectable({
  providedIn: 'root'
})
export class FilterService {

  constructor() { }

  filterBy(entities: PartEntity[], plotlines: PlotlineEntity[], characters: CharacterEntity[], locations:LocationEntity[]) {
    const filteredEntities = [];

    for (const entity of entities) {
      const filteredChildren = [];
      for (const child of entity.children) {
        for (const plotLine of plotlines) {
          if (child.plotlines.includes(plotLine)) {
            filteredChildren.push(child);
          }
        }

        for (const character of characters) {
          if (child.characters.includes(character)) {
            if (!filteredChildren.includes(child)) {
              filteredChildren.push(child);
            }
          }
        }

        for (const location of locations) {
          if (child.locations.includes(location)) {
            if (!filteredChildren.includes(child)) {
              filteredChildren.push(child);
            }
          }
        }
      }

      if (filteredChildren.length) {
        const newParent = Object.assign({}, entity);
        newParent.children = filteredChildren;      
        filteredEntities.push(newParent);
      }
    }
  }
}
