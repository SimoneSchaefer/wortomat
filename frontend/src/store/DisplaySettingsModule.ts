import { DisplaySettingsService } from "@/service/DisplaySettingsService";
import { VuexModule, Module, Mutation, Action } from "vuex-class-modules";
import { DISPLAY_SETTINGS_KEYS, NOVEL_ITEM_KEYS } from "./keys";

@Module({ generateMutationSetters: true })
export default class DisplaySettingsModule extends VuexModule {
  private _displaySettings = new DisplaySettingsService().currentSettings;

  get displaySettings(): Record<NOVEL_ITEM_KEYS, Record<DISPLAY_SETTINGS_KEYS, boolean>> {
    return this._displaySettings;
  }

  @Mutation
  public updateDisplaySettings(newSettings: Record<NOVEL_ITEM_KEYS, Record<DISPLAY_SETTINGS_KEYS, boolean>> ) {
    this._displaySettings = newSettings;
  }

  @Action
  public async setVisible(update: { novelItemKey: NOVEL_ITEM_KEYS, displaySettingKey: DISPLAY_SETTINGS_KEYS, value: boolean}): Promise<void> {
    const { novelItemKey, displaySettingKey, value} = update;
    const newSettings = new DisplaySettingsService().setVisible(novelItemKey, displaySettingKey, value);
    this.updateDisplaySettings(newSettings);
  }
}
