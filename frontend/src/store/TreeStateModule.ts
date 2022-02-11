import { VuexModule, Module, Mutation, Action } from "vuex-class-modules";

import { PARENT_ITEM_KEYS } from "./keys";

@Module({ generateMutationSetters: true })
export default class TreeStateModule extends VuexModule {
  private toggleState: Record<PARENT_ITEM_KEYS,Record<number,boolean>> = {} as any; 

  @Mutation
  public itemsToggled(newToggleState: Record<PARENT_ITEM_KEYS,Record<number,boolean>>): void {
    this.toggleState = newToggleState;
  }

  @Action
  public async toggleItems( payload: { view: PARENT_ITEM_KEYS, itemIds: number[], expanded: boolean }): Promise<void> {
    const { view, itemIds, expanded } = payload;
    const currentToggleState = {...this.toggleState};
    if (!currentToggleState[view]) {
      currentToggleState[view] = {};
    }
    for (const itemId of itemIds) {
      currentToggleState[view][itemId] = expanded;     
    }
    this.itemsToggled(currentToggleState);   
  }
}

