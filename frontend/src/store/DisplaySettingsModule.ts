import { VuexModule, Module, Mutation, Action } from "vuex-class-modules";
import { DISPLAY_SETTINGS_KEYS, PARENT_ITEM_KEYS } from "./keys";

@Module({ generateMutationSetters: true })
export default class DisplaySettingsModule extends VuexModule {
  private _displaySettings: Record<PARENT_ITEM_KEYS, Record<DISPLAY_SETTINGS_KEYS, boolean>> = Object()

  @Mutation
  public updateDisplaySettings(payload: { novelItemKey: PARENT_ITEM_KEYS, displaySettingKey: DISPLAY_SETTINGS_KEYS, value: boolean}  ) {
    if (!this._displaySettings[payload.novelItemKey]) {
      this._displaySettings[payload.novelItemKey] = Object();
    }
    this._displaySettings[payload.novelItemKey][payload.displaySettingKey] = payload.value;
  }

  @Action
  public async setVisible(payload: { novelItemKey: PARENT_ITEM_KEYS, displaySettingKey: DISPLAY_SETTINGS_KEYS, value: boolean}): Promise<void> {
    this.updateDisplaySettings(payload);
  }
}

export class DisplaySettings {
  show_title = true;
  show_summary = true;
  show_extended_summary = true;
  show_tags = true;
  show_image = true;
  show_content = true;
}


export const getAllEnumValues = (enumType) => {
  const allValues = [];
  for (const value in enumType) {
      if (isNaN(Number(value))) allValues.push(value)
  }
  return allValues;
}

