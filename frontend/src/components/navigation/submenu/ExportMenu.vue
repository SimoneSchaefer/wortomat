<template>
    <h1>Export</h1>
    <div v-for="displaySettingKey of displaySettingKeys" v-bind:key="displaySettingKey">
    <ToggleSwitch 
        :enabled="isEnabled(displaySettingKey)" 
        :label="`export_settings.include_${displaySettingKey}`"
        @toggle="toggle($event, displaySettingKey)"></ToggleSwitch>
    </div>
</template>

<script lang="ts">
import { mixins, Options } from 'vue-class-component';

import NovelItemKeyAwareMixin from '../../mixins/NovelItemKeyAwareMixin';
import { DISPLAY_SETTINGS_KEYS, PARENT_ITEM_KEYS } from '@/store/keys';

import ToggleSwitch from '@/components/forms/ToggleSwitch.vue';
import { namespace } from 's-vuex-class';
import { EXPORT_FORMAT } from '@/store/ExportSettingsModule';

const exportModule = namespace('export');

@Options({
    components: { ToggleSwitch }
})
export default class ExportMenu extends mixins(NovelItemKeyAwareMixin) {
    @exportModule.Action
    setExportIncludes!: (payload: { novelItemKey: PARENT_ITEM_KEYS, displaySettingKey: DISPLAY_SETTINGS_KEYS, value: boolean}) => Promise<void>;
  
    @exportModule.Action
    setExportFormat!: (payload: { novelItemKey: PARENT_ITEM_KEYS, format: EXPORT_FORMAT}) => Promise<void>;
    
    @exportModule.State('_exportIncludes')
    _exportIncludes!: Record<PARENT_ITEM_KEYS, Record<DISPLAY_SETTINGS_KEYS, boolean>>;

    
    isEnabled(displaySetting: DISPLAY_SETTINGS_KEYS) {
        return this.exportIncludes[displaySetting];
    }

    toggle($event, settingKey: DISPLAY_SETTINGS_KEYS) {
        this.setExportIncludes({ novelItemKey: this.parentKey, displaySettingKey: settingKey, value: $event })
    }

    get exportIncludes() {
        return this._exportIncludes[this.parentKey] || {};
    }

    get displaySettingKeys(): DISPLAY_SETTINGS_KEYS[] {
        return [
            DISPLAY_SETTINGS_KEYS.SHOW_TITLE,
            DISPLAY_SETTINGS_KEYS.SHOW_SUMMARY,
            DISPLAY_SETTINGS_KEYS.SHOW_EXTENDED_SUMMARY,
            DISPLAY_SETTINGS_KEYS.SHOW_CONTENT        ]
    }
 }
</script>