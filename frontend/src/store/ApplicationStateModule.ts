import { VuexModule, Module, Mutation, Action } from "vuex-class-modules";

import { PARENT_ITEM_KEYS } from "./keys";

@Module({ generateMutationSetters: true })
export default class ApplicationStateModule extends VuexModule {
  private _activeView = PARENT_ITEM_KEYS.PARTS; 
  private _modalOpen = false;


  @Mutation
  public activeViewSet(view: PARENT_ITEM_KEYS ) {
    this._activeView = view;
  }

  @Mutation
  public modalOpen(value: boolean ) {
    console.log('set modal open', value)
    this._modalOpen = value;
  }

  @Action
  public async setActiveView(view: PARENT_ITEM_KEYS): Promise<void> {
    this.activeViewSet(view);   
  }
  
  @Action
  public async setModalOpen(value: boolean): Promise<void> {
    this.modalOpen(value);   
  }
}

