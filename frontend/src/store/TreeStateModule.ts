import { VuexModule, Module, Mutation, Action } from "vuex-class-modules";

import { PARENT_ITEM_KEYS } from "./keys";

@Module({ generateMutationSetters: true })
export default class TreeStateModule extends VuexModule {
  private toggleState: Map<PARENT_ITEM_KEYS,Map<number,boolean>> = new Map(); 

  @Mutation
  public itemsToggled(update: { view: PARENT_ITEM_KEYS, itemIds: number[], expanded: boolean }): void {
    if (!this.toggleState.has(update.view)) {
      this.toggleState.set(update.view, new Map());
    }
    for (const itemId of update.itemIds) {
      this.toggleState.get(update.view).set(itemId, update.expanded);     
    }
  }

  @Action
  public async toggleItems( payload: { view: PARENT_ITEM_KEYS, itemIds: number[], expanded: boolean }): Promise<void> {
    const { view, itemIds, expanded } = payload;
    this.itemsToggled({ view, itemIds, expanded });   
  }
}

