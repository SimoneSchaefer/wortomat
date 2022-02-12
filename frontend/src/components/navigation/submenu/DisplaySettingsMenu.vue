<template>
<h1>{{ $t('display_settings.header') }}</h1>
<div v-for="displaySettingKey of displaySettingKeys" v-bind:key="displaySettingKey">
    <ToggleSwitch 
        :enabled="isEnabled(displaySettingKey)" 
        :label="`display_settings.${displaySettingKey}`"
        @toggle="toggle($event, displaySettingKey)"></ToggleSwitch>
</div>
</template>

<script lang="ts">
import { mixins, Options } from 'vue-class-component';
import { namespace } from 's-vuex-class';

import {  DISPLAY_SETTINGS_KEYS, PARENT_ITEM_KEYS } from '@/store/keys';
import NovelItemKeyAwareMixin from '@/components/mixins/NovelItemKeyAwareMixin';
import DisplaySettingsAwareMixin from '@/components/mixins/DisplaySettingsAwareMixin';
import ToggleSwitch from '@/components/forms/ToggleSwitch.vue';
import { getAllEnumValues } from '@/store/store.helper';


const displaySettingsModule = namespace('displaySettings');

@Options({
    components: { ToggleSwitch}
})
export default class DisplaySettingsMenu extends mixins(NovelItemKeyAwareMixin, DisplaySettingsAwareMixin) {
    @displaySettingsModule.Action
    setVisible!: (payload: { novelItemKey: PARENT_ITEM_KEYS, displaySettingKey: DISPLAY_SETTINGS_KEYS, value: boolean}) => Promise<void>;

    toggle($event, displaySettingKey: DISPLAY_SETTINGS_KEYS) {
        this.setVisible({ novelItemKey: this.parentKey, displaySettingKey: displaySettingKey, value: $event})
    }

    get displaySettingKeys() {
        return getAllEnumValues(DISPLAY_SETTINGS_KEYS);
    }
}
</script>

<style >
.p-sidebar.p-sidebar-active.p-sidebar-right {
    right: 80px;
}
</style>

<style scoped>
.vertical-menu {
  display: flex;
  flex-direction: column;
  align-items: center;
  height: 100%;
  width: 80px;
  flex-shrink: 0;
  background: var(--tabmenu-background);
  border-left: 3px solid #2d2b2b94;
  z-index: 1102;
}

.navigation-link{
    height: 5em;
    width: 5em !important;
    display: flex;
    justify-content: center;
    align-items: center;
    color: #efefef7e;
    border: none;
    border-bottom: 1px solid #efefef7e;
    text-decoration: none;
    background: transparent
}


</style>
