import { VuexModule, Module, Mutation, Action } from "vuex-class-modules";
import { DISPLAY_SETTINGS_KEYS, PARENT_ITEM_KEYS } from "./keys";

@Module({ generateMutationSetters: true })
export default class DisplaySettingsModule extends VuexModule {
  private _displaySettings: Record<PARENT_ITEM_KEYS, Record<DISPLAY_SETTINGS_KEYS, boolean>> = Object()

  @Mutation
  public updateDisplaySettings(newDisplaySettings: Record<PARENT_ITEM_KEYS, Record<DISPLAY_SETTINGS_KEYS, boolean>>) {
    this._displaySettings = newDisplaySettings;
  }

  @Action
  public async setVisible(payload: { novelItemKey: PARENT_ITEM_KEYS, displaySettingKey: DISPLAY_SETTINGS_KEYS, value: boolean}): Promise<void> {
    const displaySettings = {...this._displaySettings};
    if (!displaySettings[payload.novelItemKey]) {
      displaySettings[payload.novelItemKey] = Object();
    }
    displaySettings[payload.novelItemKey][payload.displaySettingKey] = payload.value;
    this.updateDisplaySettings(displaySettings);
  }
}

