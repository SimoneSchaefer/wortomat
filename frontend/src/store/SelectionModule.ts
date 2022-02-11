import { VuexModule, Module, Mutation, Action } from "vuex-class-modules";

import { PARENT_ITEM_KEYS } from "./keys";

@Module({ generateMutationSetters: true })
export default class SelectionModule extends VuexModule {
  private _selectedItemIds: Record<PARENT_ITEM_KEYS,number[]> = {} as any; 

  @Mutation
  public itemsSelected(update: Record<PARENT_ITEM_KEYS,number[]>): void {
    this._selectedItemIds= update;
  }

  @Action
  public async selectItemIds( payload: { view: PARENT_ITEM_KEYS, itemIds: number[] }): Promise<void> {
    const { view, itemIds } = payload;
    const selected = {...this._selectedItemIds};
    if (!selected[view]) selected[view] = [];
    selected[view] = itemIds;
    this.itemsSelected(selected);   
  }
}

