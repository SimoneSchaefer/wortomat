<template>
    <h1>Export</h1>
    <div v-for="displaySettingKey of displaySettingKeys" v-bind:key="displaySettingKey">
        <ToggleSwitch :enabled="isEnabled(displaySettingKey)" :label="`export_settings.include_${displaySettingKey}`"
            @toggle="toggle($event, displaySettingKey)"></ToggleSwitch>
    </div>

    <div class="formats">
        <span class="hint">Export as</span>
        <SelectButton v-model="selectedType" :options="typeOptions" :multiple="false" />
    </div>

    <div class="export-info" v-if="selectedType === 'PDF_LATEX'">
        <span class="hint"><i class="fa fa-info-circle"></i>&nbsp;Note that for this kind of export, you need
            texlive,
            texlive-latex-extra and pandoc installed on your computer.</span>
    </div>
    <div v-if="selectedType === 'PDF_LATEX' || selectedType === 'PDF'">
        <PageSettings :selectedType="selectedType"></PageSettings>
    </div>

    <div class="button">
        <Button @click="exportView()">Export now!</Button>
    </div>
</template>

<script lang="ts">
import { mixins, Options } from 'vue-class-component';

import NovelItemKeyAwareMixin from '../../mixins/NovelItemKeyAwareMixin';
import PageSettings from './PageSettings.vue';
import { DISPLAY_SETTINGS_KEYS, PARENT_ITEM_KEYS } from '@/store/keys';

import ToggleSwitch from '@/components/forms/ToggleSwitch.vue';
import { namespace } from 's-vuex-class';
import { EXPORT_FORMAT } from '@/store/ExportSettingsModule';
import { getAllEnumValues } from '@/store/store.helper';
import { ExportService } from '@/service/ExportService';

const exportModule = namespace('export');

@Options({
    components: { ToggleSwitch, PageSettings }
})
export default class ExportMenu extends mixins(NovelItemKeyAwareMixin) {
    selectedType = this.typeOptions[0];

    @exportModule.Action
    setExportIncludes!: (payload: { novelItemKey: PARENT_ITEM_KEYS, displaySettingKey: DISPLAY_SETTINGS_KEYS, value: boolean }) => Promise<void>;

    @exportModule.Action
    setExportFormat!: (payload: { novelItemKey: PARENT_ITEM_KEYS, format: EXPORT_FORMAT }) => Promise<void>;

    @exportModule.State('_exportIncludes')
    _exportIncludes!: Record<PARENT_ITEM_KEYS, Record<DISPLAY_SETTINGS_KEYS, boolean>>;

    @exportModule.State('_exportFormat')
    _exportFormat!: Record<PARENT_ITEM_KEYS, EXPORT_FORMAT>;

    exportView() {
        const exportOptions = {
            format: this.selectedType || EXPORT_FORMAT.HTML,
            itemType: this.parentKey,
            includeSummary: this.isEnabled(DISPLAY_SETTINGS_KEYS.SHOW_SUMMARY),
            includeExtendedSummary: this.isEnabled(DISPLAY_SETTINGS_KEYS.SHOW_EXTENDED_SUMMARY),
            includeContent: this.isEnabled(DISPLAY_SETTINGS_KEYS.SHOW_CONTENT),
        }

        new ExportService().export(this.novelId, exportOptions).then((response) => {
            this.$toast.add({ severity: 'success', summary: 'Success', detail: `Your novel has been exported to ${response.data}`, life: 3000 });
        }, error => {
            this.$toast.add({ severity: 'error', summary: 'This did not work :(', detail: error, life: 3000 });
        });
    }

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
            // DISPLAY_SETTINGS_KEYS.SHOW_TITLE,
            DISPLAY_SETTINGS_KEYS.SHOW_SUMMARY,
            DISPLAY_SETTINGS_KEYS.SHOW_EXTENDED_SUMMARY,
            DISPLAY_SETTINGS_KEYS.SHOW_CONTENT
        ]
    }

    get selectedFormat() {
        console.log('selected format', this._exportFormat)
        if (!this._exportFormat || !Object.keys(this._exportFormat).includes(PARENT_ITEM_KEYS.PARTS)) return EXPORT_FORMAT.HTML;
        return this._exportFormat[PARENT_ITEM_KEYS.PARTS];
    }

    set selectedFormat(format: EXPORT_FORMAT) {
        this.setExportFormat({ novelItemKey: this.parentKey, format: format })

    }

    get typeOptions() {
        return getAllEnumValues(EXPORT_FORMAT);
    }
}
</script>

<style scoped>
.hint {
    color: gray;
}

.export-info {
    margin-bottom: 2em;
}

.formats {
    margin: 2em 0;
}

.button {
    margin: 2em;
    display: flex;
    align-items: center;
    justify-content: center;
}
</style>