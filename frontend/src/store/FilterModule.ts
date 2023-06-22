import { TagModel } from "@/models/Tag.model";
import { VuexModule, Module, Mutation, Action } from "vuex-class-modules";
import { PARENT_ITEM_KEYS } from "./keys";
import { STATUS } from '@/models/Status';

@Module({ generateMutationSetters: true })
export default class FilterModule extends VuexModule {
  private _tagFilterSettings: Record<PARENT_ITEM_KEYS, TagFilterSetting> = Object()
  private _markerFilterSettings: Record<PARENT_ITEM_KEYS, MarkerFilterSetting> = Object()
  private _statusFilterSettings: Record<PARENT_ITEM_KEYS, StatusFilterSetting> = Object()

  @Mutation
  public updateTagFilterSetting(newFilterSettings: Record<PARENT_ITEM_KEYS, TagFilterSetting>) {
    this._tagFilterSettings = newFilterSettings;
  }
  @Mutation
  public updateMarkerFilterSetting(newFilterSettings: Record<PARENT_ITEM_KEYS, MarkerFilterSetting>) {
    this._markerFilterSettings = newFilterSettings;
  }
  @Mutation
  public updateStatusFilterSetting(newFilterSettings: Record<PARENT_ITEM_KEYS, StatusFilterSetting>) {
    this._statusFilterSettings = newFilterSettings;
  }
 
  @Action
  public async setMarkerFilter(payload: { novelItemKey: PARENT_ITEM_KEYS, enabled: boolean, checkedStatus: MARKER[]}): Promise<void> {
    const filterSettings = {...this._markerFilterSettings};
    if (!filterSettings[payload.novelItemKey]) {
      filterSettings[payload.novelItemKey] = Object();
    }
    filterSettings[payload.novelItemKey].enabled = payload.enabled;
    filterSettings[payload.novelItemKey].status = [];
    for (const status of payload.checkedStatus) {
      filterSettings[payload.novelItemKey].status.push(status);
    }
    this.updateMarkerFilterSetting(filterSettings);
  } 

  @Action
  public async setStatusFilter(payload: { novelItemKey: PARENT_ITEM_KEYS, enabled: boolean, checkedStatus: STATUS[]}): Promise<void> {
    const filterSettings = {...this._statusFilterSettings};
    if (!filterSettings[payload.novelItemKey]) {
      filterSettings[payload.novelItemKey] = Object();
    }
    filterSettings[payload.novelItemKey].enabled = payload.enabled;
    filterSettings[payload.novelItemKey].status = [];
    for (const status of payload.checkedStatus) {
      filterSettings[payload.novelItemKey].status.push(status);
    }
    this.updateStatusFilterSetting(filterSettings);
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

export interface MarkerFilterSetting {
  enabled: boolean;
  status: MARKER[];
}

export interface StatusFilterSetting {
  enabled: boolean;
  status: STATUS[];
}

export enum MARKER {
  TODO = 'TODO',
  IDEA = 'IDEA',
  FIXME = 'FIXME'
}

