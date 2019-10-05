import { Injectable } from '@angular/core';
import {BaseEntity, ENTITY_TYPE} from '../entity/_baseEntity'

/*
export enum STATE {
  COLLAPSED = "collapsed",
  EXPANDED = "expanded"
}*/

export enum DISPLAY_STATE {
  VISIBLE = "visible",
  HIDDEN = "hidden"
}

export type DISPLAY_ITEM= 'summary' | 'extended_summary' | 'content';


export class USER_STATE {
  contentDisplayStates = new Map<ENTITY_TYPE, CONTENT_DISPLAY_STATE>();
  collapseState =  new Map<ENTITY_TYPE, Array<VISIBLITY_STATE>>();

  constructor() {
  //  this.contentDisplayStates = new CONTENT_DISPLAY_STATES();
  //  this.collapseState = new COLLAPSE_STATES();
  }
}
/*
class COLLAPSE_STATES {  
  states = new Map<ENTITY_TYPE,Array<VISIBLITY_STATE>>();

  set(type: ENTITY_TYPE, entity: BaseEntity, displayState: DISPLAY_STATE) {
    let currentForType = this.getOrCreate(type);
    let currentStateForEntity = currentForType.find(s => {
      s.id === entity.id
    });
    if (!currentStateForEntity) {
      currentForType.push({id: entity.id, displayState: displayState} as VISIBLITY_STATE);
    } else {
      currentStateForEntity.displayState = displayState;
    }
  }

  getOrCreate(type: ENTITY_TYPE) {
    if (this.states.has(type)) {
      return this.states.get(type);
    }
    let newState = new Array<VISIBLITY_STATE>()
    this.states.set(type, newState);
    return newState;
  }
}*/
/*

class CONTENT_DISPLAY_STATES {  
  states = new Map<ENTITY_TYPE, CONTENT_DISPLAY_STATE>();

  set(type: ENTITY_TYPE, displayItem: DISPLAY_ITEM, displayState: DISPLAY_STATE) {
    let state = this.getOrCreate(type);
    state[displayItem] = displayState;
  }

  getOrCreate(type: ENTITY_TYPE) {
    if (this.states.has(type)) {
      return this.states.get(type);
    }
    let newState = new CONTENT_DISPLAY_STATE()
    this.states.set(type, newState);
    return newState;
  }
}*/


class CONTENT_DISPLAY_STATE {
  summary = DISPLAY_STATE.HIDDEN;
  extended_summary = DISPLAY_STATE.HIDDEN;
  content =  DISPLAY_STATE.VISIBLE
}

class VISIBLITY_STATE {
  id: number;
  displayState: DISPLAY_STATE
}




@Injectable()
export class StateService {
  
  constructor() { this.getOrCreateState(); }


  showItem(type: ENTITY_TYPE, displayItem: DISPLAY_ITEM) {
    return this.getOrCreateDisplayItemState(type)[displayItem] == DISPLAY_STATE.VISIBLE;
  }

  entityCollapsed(type: ENTITY_TYPE, entity: BaseEntity) {
    return this.getOrCreateCollapseStates(type, entity).displayState == DISPLAY_STATE.VISIBLE;
  }

  toggleDisplayItemState(type: ENTITY_TYPE, displayItem: DISPLAY_ITEM) {
    let currentForType = this.getOrCreateDisplayItemState(type);
    let newState = currentForType[displayItem] == DISPLAY_STATE.VISIBLE ? DISPLAY_STATE.HIDDEN : DISPLAY_STATE.VISIBLE;
    currentForType[displayItem] = newState;

    let state = this.getOrCreateState();
    state.contentDisplayStates[type] = currentForType;
    this.store(state);
  }

  toggleItemCollapseState(type: ENTITY_TYPE, entity: BaseEntity) {
    let currentForType = this.getOrCreateCollapseStates(type, entity);
    let newState = currentForType.displayState == DISPLAY_STATE.VISIBLE ? DISPLAY_STATE.HIDDEN : DISPLAY_STATE.VISIBLE;
    let state = this.getOrCreateState();
    let index = state.collapseState[type].findIndex(state => {
      return state.id === entity.id
    });
    state.collapseState[type][index].displayState = newState;
    this.store(state);
  }


  private getOrCreateDisplayItemState(type: ENTITY_TYPE): CONTENT_DISPLAY_STATE {
    let userState = this.getOrCreateState();
    if (!Object.keys(userState.contentDisplayStates).includes(type)) {
      userState.contentDisplayStates[type] = new CONTENT_DISPLAY_STATE();
      this.store(userState);
    }
    return userState.contentDisplayStates[type];
  }

  private getOrCreateCollapseStates(type: ENTITY_TYPE, entity: BaseEntity): VISIBLITY_STATE {
    let userState = this.getOrCreateState();
    if (!Object.keys(userState.collapseState).includes(type)) {
      let newStates = Array<VISIBLITY_STATE>();
      userState.collapseState[type] = newStates;
      this.store(userState);
    }
    let currentState = userState.collapseState[type].find(state => {
      return state.id === entity.id
    });
    if (!currentState) {
      currentState = {
        id: entity.id,
        displayState: DISPLAY_STATE.VISIBLE
      }
      userState.collapseState[type].push(currentState);
      this.store(userState);
    }
    return currentState; 
  }


  private getOrCreateState(): USER_STATE {
    let state = localStorage.getItem('user_state');
    if (!state) {
      this.store(new USER_STATE());
    }
    return JSON.parse(localStorage.getItem('user_state')) as USER_STATE;
  }

  private store(userState: USER_STATE) {
    localStorage.setItem('user_state', JSON.stringify(userState));
  }
}