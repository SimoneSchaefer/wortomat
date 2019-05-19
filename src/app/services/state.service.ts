import { Injectable } from '@angular/core';
import {BaseEntity, ENTITY_TYPE} from '../entity/_baseEntity'



export enum STATE {
  COLLAPSED = "collapsed",
  EXPANDED = "expanded"
}

@Injectable()
export class StateService {

  
  constructor() { }
  
  toggleState(type: ENTITY_TYPE, entity : BaseEntity) : void {
    let currentState = this.getState(type, entity);
    let newState : STATE;
    if (currentState == STATE.EXPANDED) {
      newState = STATE.COLLAPSED;
    } else {
      newState = STATE.EXPANDED;
    }
    this.setState(type, entity, newState);
  }

  setState(type : ENTITY_TYPE, entity : BaseEntity, state: STATE) {
    let states = this.getOrCreate(type);
    states[this.generateIndexKey(entity)] = state;    
    localStorage.setItem(this.generateKey(type), JSON.stringify(states));
  }

  getOrCreate(type : ENTITY_TYPE) : Object {
    let states = localStorage.getItem(this.generateKey(type));
    if (!states) {
      localStorage.setItem(this.generateKey(type), JSON.stringify({}));
    }
    return JSON.parse(localStorage.getItem(this.generateKey(type)));
  }

  


  getState(type: ENTITY_TYPE, entity : BaseEntity) : STATE {
    let states = this.getOrCreate(type);
    let indexKey = this.generateIndexKey(entity);
    if (!states[indexKey]) {
      states[indexKey] = STATE.EXPANDED;
    }
    return states[indexKey];
  }



  private generateIndexKey(entity : BaseEntity) : string {
    return `state_${entity.id}`;
  }

  private generateKey(type : ENTITY_TYPE) : string {
    return `states_${type}`;
  }
}