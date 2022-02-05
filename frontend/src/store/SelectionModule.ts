import { VuexModule, Module, Mutation, Action } from "vuex-class-modules";

import { PARENT_ITEM_KEYS } from "./keys";

@Module({ generateMutationSetters: true })
export default class SelectionModule extends VuexModule {
  private _selectedItemIds: Map<PARENT_ITEM_KEYS,number[]> = new Map(); 

  @Mutation
  public itemsSelected(update: { view: PARENT_ITEM_KEYS, itemIds: number[] }): void {
    this._selectedItemIds.set(update.view, update.itemIds);
  }

  @Action
  public async selectItemIds( payload: { view: PARENT_ITEM_KEYS, itemIds: number[] }): Promise<void> {
    const { view, itemIds } = payload;
    this.itemsSelected({ view, itemIds });   
  }
}

