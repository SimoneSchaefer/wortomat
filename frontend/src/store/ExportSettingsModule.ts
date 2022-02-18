import { VuexModule, Module, Mutation, Action } from "vuex-class-modules";
import { DISPLAY_SETTINGS_KEYS, PARENT_ITEM_KEYS } from "./keys";

@Module({ generateMutationSetters: true })
export default class ExportSettingsModule extends VuexModule {
  private _exportIncludes: Record<PARENT_ITEM_KEYS, Record<DISPLAY_SETTINGS_KEYS,boolean>> = Object()
  private _exportFormat: Record<PARENT_ITEM_KEYS, EXPORT_FORMAT>;

  @Mutation
  public updateExportIncludes(newDisplaySettings: Record<PARENT_ITEM_KEYS, Record<DISPLAY_SETTINGS_KEYS, boolean>>) {
    this._exportIncludes = newDisplaySettings;
  }

  @Mutation
  public updateExportFormat(format: Record<PARENT_ITEM_KEYS,EXPORT_FORMAT>) {
    console.log('update format', format)
    this._exportFormat = format;
  }

  @Action
  public async setExportFormat(payload: { novelItemKey: PARENT_ITEM_KEYS, format: EXPORT_FORMAT }): Promise<void> {
    const formatSetting = { ...this._exportFormat };
    formatSetting[payload.novelItemKey] = payload.format;
    this.updateExportFormat(formatSetting);
  }

  @Action
  public async setExportIncludes(payload: { novelItemKey: PARENT_ITEM_KEYS, displaySettingKey: DISPLAY_SETTINGS_KEYS, value:  boolean }): Promise<void> {
    const displaySettings = {...this._exportIncludes};
    if (!displaySettings[payload.novelItemKey]) {
      displaySettings[payload.novelItemKey] = Object();
    }
     displaySettings[payload.novelItemKey][payload.displaySettingKey] = payload.value;
    this.updateExportIncludes(displaySettings);
  }
}


export enum EXPORT_FORMAT {
 HTML = 'HTML',
 PDF = 'PDF',
 PDF_LATEX = 'PDF_LATEX'
}

export interface ExportSettings {
  visible:  Record<DISPLAY_SETTINGS_KEYS, boolean>;
  format: EXPORT_FORMAT
}
