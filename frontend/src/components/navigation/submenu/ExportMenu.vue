<template>
    <h1>Coming soon</h1>
</template>

<script lang="ts">
import { mixins, Options, Vue } from 'vue-class-component';
import { Prop } from 'vue-property-decorator';

import Navlink from '@/components/navigation/Navlink.vue'
import DisplaySettingsMenu from '@/components/navigation/submenu/DisplaySettingsMenu.vue'
import NovelItemKeyAwareMixin from '../../mixins/NovelItemKeyAwareMixin';


type visible_flags = '' | 'filter_visible' | 'export_visible' | 'display_settings_visible';

@Options({
    components: { Navlink, DisplaySettingsMenu }
})
export default class ExportMenu extends mixins(NovelItemKeyAwareMixin) {
 }
</script>