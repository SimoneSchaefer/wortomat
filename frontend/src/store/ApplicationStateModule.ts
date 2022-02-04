import { VuexModule, Module, Mutation, Action } from "vuex-class-modules";

import { PARENT_ITEM_KEYS } from "./keys";

@Module({ generateMutationSetters: true })
export default class ApplicationStateModule extends VuexModule {
  private _activeView = PARENT_ITEM_KEYS.PARTS; 


  @Mutation
  public activeViewSet(view: PARENT_ITEM_KEYS ) {
    this._activeView = view;
  }

  @Action
  public async setActiveView(view: PARENT_ITEM_KEYS): Promise<void> {
    this.activeViewSet(view);   
  }
}

