<template>
<h1>{{ $t('display_settings.header') }}</h1>
<div v-for="displaySettingKey of displaySettingKeys" v-bind:key="displaySettingKey" class="toggle-switch">
    <ToggleSwitch 
        :enabled="isEnabled(displaySettingKey)" 
        :label="`display_settings.${displaySettingKey}`"
        @toggle="toggle($event, displaySettingKey)"></ToggleSwitch>
</div>
</template>

<script lang="ts">
import { mixins, Options } from 'vue-class-component';
import {  DISPLAY_SETTINGS_KEYS, NOVEL_ITEM_KEYS } from '@/store/keys';
import { BaseModel } from '@/models/Base.model';
import { DisplaySettingsService } from '@/service/DisplaySettingsService';
import NovelItemKeyAwareMixin from '../../mixins/NovelItemKeyAwareMixin';
import DisplaySettingsAwareMixin from '@/components/mixins/DisplaySettingsAwareMixin';
import ToggleSwitch from '@/components/forms/ToggleSwitch.vue';



@Options({
    components: { ToggleSwitch}
})
export default class DisplaySettingsMenu extends mixins(NovelItemKeyAwareMixin, DisplaySettingsAwareMixin) {
   
    private displaySettingService = new DisplaySettingsService();

    toggle($event, displaySettingKey: DISPLAY_SETTINGS_KEYS) {
        this.$store.dispatch('updateDisplaySettings', { novelItemKey: this.childKey, displaySettingKey: displaySettingKey, value: $event});
    }

    get displaySettingKeys() {
        return this.displaySettingService.getAllEnumValues(DISPLAY_SETTINGS_KEYS);
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



.toggle-switch {
    line-height: 3.0em;
    display: flex;
    align-items: center;
}

.toggle-switch .label {
    margin-left: 1em;;
}
</style>
