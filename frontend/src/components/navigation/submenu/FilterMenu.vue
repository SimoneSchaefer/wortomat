<template>
    <h1>Coming soon</h1>
</template>

<script lang="ts">
import { mixins, Options, Vue } from 'vue-class-component';
import { Prop } from 'vue-property-decorator';

import Navlink from '@/components/navigation/Navlink.vue'
import DisplaySettingsMenu from '@/components/navigation/submenu/DisplaySettingsMenu.vue'
import {  DISPLAY_SETTINGS_KEYS, NOVEL_ITEM_KEYS } from '@/store/keys';
import { BaseModel } from '@/models/Base.model';
import { DisplaySettingsService } from '@/service/DisplaySettingsService';
import NovelItemKeyAwareMixin from '../../mixins/NovelItemKeyAwareMixin';


@Options({
    components: { Navlink, DisplaySettingsMenu }
})
export default class FilterMenu extends mixins(NovelItemKeyAwareMixin) {
 }
</script>