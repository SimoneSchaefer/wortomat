<template>
    <h1>Filter</h1>
    <div class="filter-group">
        <ToggleSwitch 
            :enabled="tagFilterEnabled" 
            :label="`filter_settings.tag_filter_enabled`"
            @toggle="toggleTagFilter($event)"></ToggleSwitch>
        <div v-if="tagFilterEnabled">
            <div class="hint">
                <i class="fa fa-info"></i>
                See only items including the following tags 
            </div>
            <EditableTags
                :novelItemKey="parentKey"
                :selectedTags="selectedTags" 
                @update-tags="updateTags($event)"></EditableTags>
        </div>
    </div>

    <div class="filter-group">
        <ToggleSwitch 
            :enabled="statusFilterEnabled" 
            :label="`filter_settings.status_filter_enabled`"
            @toggle="toggleStatusFilter($event)"></ToggleSwitch>
        
        <div v-if="statusFilterEnabled">
            <div class="hint">
                <i class="fa fa-info"></i>
                See only items that have at least one of the following status markers
            </div>
            <div class="choice">
                <Checkbox @toggle="toggleTodo($event)" :enabled="todoChecked" label="TODO"/>
                <Checkbox @toggle="toggleIdea($event)" :enabled="ideaChecked" label="IDEA"/>
                <Checkbox @toggle="toggleFixme($event)" :enabled="fixmeChecked" label="FIXME" />
            </div>
        </div>
    </div>
</template>

<script lang="ts">
import { mixins, Options } from 'vue-class-component';
import { namespace } from 's-vuex-class';

import { PARENT_ITEM_KEYS } from '@/store/keys';
import { TagModel } from '@/models/Tag.model';
import { STATUS, StatusFilterSetting } from '@/store/FilterModule';

import NovelItemKeyAwareMixin from '@/components/mixins/NovelItemKeyAwareMixin';
import ToggleSwitch from '@/components/forms/ToggleSwitch.vue';
import Checkbox from '@/components/forms/Checkbox.vue';
import EditableTags from '@/components/forms/inline-edit/EditableTags.vue';
import FilterAwareMixin from '@/components/mixins/FilterAwareMixin';




const filterModule = namespace('filter');

@Options({
    components: { ToggleSwitch, EditableTags, Checkbox }
})
export default class FilterMenu extends mixins(NovelItemKeyAwareMixin, FilterAwareMixin) {    
    TODO_CHECKED = false;
    FIXME_CHECKED = true;
    IDEA_CHECKED = false;
    @filterModule.Action
    setTagFilter: (payload: { novelItemKey: PARENT_ITEM_KEYS, enabled: boolean, tags: TagModel[]}) => Promise<void>;
        
    @filterModule.Action
    setStatusFilter: (payload: { novelItemKey: PARENT_ITEM_KEYS, enabled: boolean, checkedStatus: STATUS[]}) => Promise<void>;
    
    toggleTagFilter($event) {
        this.setTagFilter({ novelItemKey: this.parentKey, enabled: $event, tags: this.selectedTags });
    }

    toggleTodo($event) {
        this.setStatusFilter({ novelItemKey: this.parentKey, enabled: this.statusFilterEnabled, checkedStatus: [ STATUS.TODO ]})
    }

    toggleIdea($event) {
        this.setStatusFilter({ novelItemKey: this.parentKey, enabled: this.statusFilterEnabled, checkedStatus: [ STATUS.IDEA ]})       
    }
    toggleFixme($event) {
        this.setStatusFilter({ novelItemKey: this.parentKey, enabled: this.statusFilterEnabled, checkedStatus: [ STATUS.FIXME ]})
    }

    toggleStatusFilter($event) {
        this.setStatusFilter({ novelItemKey: this.parentKey, enabled: $event, checkedStatus: [ STATUS.TODO, STATUS.FIXME ]})
    }

    updateTags($event) {
        this.setTagFilter({ novelItemKey: this.parentKey, enabled: this.tagFilterEnabled, tags: $event});
    }

    get todoChecked() {
        return this.statusFilterSettings.status.includes(STATUS.TODO);
    }
    get fixmeChecked() {
        return this.statusFilterSettings.status.includes(STATUS.FIXME);
    }
    get ideaChecked() {
        return this.statusFilterSettings.status.includes(STATUS.IDEA);
    }

    get statusFilterSettings(): StatusFilterSetting {
        return this._statusFilterSettings[this.parentKey] || {} as StatusFilterSetting;
    }
 }
</script>

<style scoped>
.filter-group {
    margin: 1em 0;
}

.choice {
    line-height: 1.5em;
    display: flex;
    flex-direction: column;
}

.hint {
    color: #d2d2d2;
}
</style>