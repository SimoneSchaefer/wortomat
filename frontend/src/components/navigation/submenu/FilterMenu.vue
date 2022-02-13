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
                <Checkbox v-for="status of allStatus" :key="status"
                    :enabled="selected(status)" 
                    :label="`filter_settings.status_filter_${status}`" 
                    @toggle="toggle(status, $event)" />

              <!--  <Checkbox @toggle="toggleTodo($event)" :model="selectedStatus" label="TODO"/>
                <Checkbox @toggle="toggleIdea($event)" :model="selectedStatus" label="IDEA"/>
                <Checkbox @toggle="toggleFixme($event)" :model="selectedStatus" label="FIXME" />-->
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
import { getAllEnumValues } from '@/store/store.helper';




const filterModule = namespace('filter');

@Options({
    components: { ToggleSwitch, EditableTags, Checkbox }
})
export default class FilterMenu extends mixins(NovelItemKeyAwareMixin, FilterAwareMixin) {    
    @filterModule.Action
    setTagFilter: (payload: { novelItemKey: PARENT_ITEM_KEYS, enabled: boolean, tags: TagModel[]}) => Promise<void>;
        
    @filterModule.Action
    setStatusFilter: (payload: { novelItemKey: PARENT_ITEM_KEYS, enabled: boolean, checkedStatus: STATUS[]}) => Promise<void>;
    
    toggle(status: STATUS, $event: boolean) {
        
        const currentlySelectedStatus = [...this.checkedStatus];
        const index = this.checkedStatus.findIndex((s) => status === s);
        if ($event && index < 0) {
            currentlySelectedStatus.push(status);
        } 
        if (!$event && index > -1) {
            currentlySelectedStatus.splice(index, 1);
        }
        this.setStatusFilter({ novelItemKey: this.parentKey, enabled: this.statusFilterEnabled, checkedStatus: currentlySelectedStatus })
    }    
    
    selected(status: STATUS) {
        return this.checkedStatus.includes(status);
    }

    toggleTagFilter($event) {
        this.setTagFilter({ novelItemKey: this.parentKey, enabled: $event, tags: this.selectedTags });
    }

    toggleStatusFilter($event) {
        this.setStatusFilter({ novelItemKey: this.parentKey, enabled: $event, checkedStatus: []})
    }

    updateTags($event) {
        this.setTagFilter({ novelItemKey: this.parentKey, enabled: this.tagFilterEnabled, tags: $event});
    }

    get allStatus() {
        return getAllEnumValues(STATUS);
    }

    get checkedStatus() {
        return this.statusFilterSettings.status || [];
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