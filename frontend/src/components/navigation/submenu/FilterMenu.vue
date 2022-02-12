<template>
    <h1>Filter</h1>
    <ToggleSwitch 
        :enabled="tagFilterEnabled" 
        :label="`filter_settings.tag_filter_enabled`"
        @toggle="toggleTagFilter($event)"></ToggleSwitch>
                
    <EditableTags v-if="tagFilterEnabled"
        :novelItemKey="parentKey"
        :selectedTags="selectedTags" 
        @update-tags="updateTags($event)"></EditableTags>

    
</template>

<script lang="ts">
import { mixins, Options } from 'vue-class-component';
import { namespace } from 's-vuex-class';

import { PARENT_ITEM_KEYS } from '@/store/keys';
import { TagFilterSetting } from '@/store/FilterModule';

import NovelItemKeyAwareMixin from '@/components/mixins/NovelItemKeyAwareMixin';
import ToggleSwitch from '@/components/forms/ToggleSwitch.vue';
import EditableTags from '@/components/forms/inline-edit/EditableTags.vue';
import { TagModel } from '@/models/Tag.model';
import FilterAwareMixin from '@/components/mixins/FilterAwareMixin';


const filterModule = namespace('filter');

@Options({
    components: { ToggleSwitch, EditableTags }
})
export default class FilterMenu extends mixins(NovelItemKeyAwareMixin, FilterAwareMixin) {    
    @filterModule.Action
    setTagFilter: (payload: { novelItemKey: PARENT_ITEM_KEYS, enabled: boolean, tags: TagModel[]}) => Promise<void>;
    
    toggleTagFilter($event) {
        this.setTagFilter({ novelItemKey: this.parentKey, enabled: $event, tags: this.selectedTags });
    }

    updateTags($event) {
        this.setTagFilter({ novelItemKey: this.parentKey, enabled: this.tagFilterEnabled, tags: $event});
    }


 }
</script>