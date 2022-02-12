import { TagModel } from "@/models/Tag.model";
import { VuexModule, Module, Mutation, Action } from "vuex-class-modules";
import { PARENT_ITEM_KEYS } from "./keys";

@Module({ generateMutationSetters: true })
export default class FilterModule extends VuexModule {
  private _tagFilterSettings: Record<PARENT_ITEM_KEYS, TagFilterSetting> = Object()

  @Mutation
  public updateTagFilterSetting(newFilterSettings: Record<PARENT_ITEM_KEYS, TagFilterSetting>) {
    this._tagFilterSettings = newFilterSettings;
  }

  @Action
  public async setTagFilter(payload: { novelItemKey: PARENT_ITEM_KEYS, enabled: boolean, tags: TagModel[]}): Promise<void> {
    const tagSettings = {...this._tagFilterSettings};
    if (!tagSettings[payload.novelItemKey]) {
      tagSettings[payload.novelItemKey] = Object();
    }
    tagSettings[payload.novelItemKey].enabled = payload.enabled;
    tagSettings[payload.novelItemKey].tags = payload.tags;    
    this.updateTagFilterSetting(tagSettings);
  }
}

export interface TagFilterSetting {
  enabled: boolean;
  tags: TagModel[];
}

