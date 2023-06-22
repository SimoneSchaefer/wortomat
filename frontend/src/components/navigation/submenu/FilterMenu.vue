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
                See only items including at least one of the following tags. <br>If no tags are selected, all items without any tags are displayed. 
            </div>
            <EditableTags
                :novelItemKey="parentKey"
                :selectedTags="selectedTags" 
                :addNewTagPossible="false"
                @update-tags="updateTags($event)"></EditableTags>
        </div>
    </div>

    <div class="filter-group">
        <ToggleSwitch 
            :enabled="markerFilterEnabled" 
            :label="`filter_settings.marker_filter_enabled`"
            @toggle="toggleMarkerFilter($event)"></ToggleSwitch>
        
        <div v-if="markerFilterEnabled">
            <div class="hint">
                <i class="fa fa-info"></i>
                See only items that have at least one of the following status markers.<br>
                If no status markers are selected, only items without any marker are shown.
            </div>
            <div class="choice">
                <Checkbox v-for="status of allMarkers" :key="status"
                    :enabled="selected(status)" 
                    :label="`filter_settings.marker_filter_${status}`" 
                    @toggle="toggleMarker(status, $event)" />
            </div>
        </div>
    </div> 
    
    <div class="filter-group">
        <ToggleSwitch 
            :enabled="statusFilterEnabled" 
            :label="`filter_settings.status_filter_enabled`"
            @toggle="toggleStatusFilter($event)"></ToggleSwitch>
        
        <div v-if="statusFilterEnabled">           
            <div class="choice">
                <Checkbox v-for="status of allStatus" :key="status"
                    :enabled="statusSelected(status)" 
                    :label="`filter_settings.status_filter_${status}`" 
                    @toggle="toggleStatus(status, $event)" />
            </div>
        </div>
    </div>
</template>

<script lang="ts">
import { mixins, Options } from 'vue-class-component';
import { namespace } from 's-vuex-class';

import { PARENT_ITEM_KEYS } from '@/store/keys';
import { TagModel } from '@/models/Tag.model';
import { MARKER, MarkerFilterSetting, StatusFilterSetting } from '@/store/FilterModule';

import NovelItemKeyAwareMixin from '@/components/mixins/NovelItemKeyAwareMixin';
import ToggleSwitch from '@/components/forms/ToggleSwitch.vue';
import Checkbox from '@/components/forms/Checkbox.vue';
import EditableTags from '@/components/forms/inline-edit/EditableTags.vue';
import FilterAwareMixin from '@/components/mixins/FilterAwareMixin';
import { getAllEnumValues } from '@/store/store.helper';
import { STATUS } from '@/models/Status';




const filterModule = namespace('filter');

@Options({
    components: { ToggleSwitch, EditableTags, Checkbox }
})
export default class FilterMenu extends mixins(NovelItemKeyAwareMixin, FilterAwareMixin) {    
    @filterModule.Action
    setTagFilter: (payload: { novelItemKey: PARENT_ITEM_KEYS, enabled: boolean, tags: TagModel[]}) => Promise<void>;
        
    @filterModule.Action
    setStatusFilter: (payload: { novelItemKey: PARENT_ITEM_KEYS, enabled: boolean, checkedStatus: STATUS[]}) => Promise<void>;
          
    @filterModule.Action
    setMarkerFilter: (payload: { novelItemKey: PARENT_ITEM_KEYS, enabled: boolean, checkedStatus: MARKER[]}) => Promise<void>;
    
    toggleMarker(status: MARKER, $event: boolean) {        
        const currentlySelectedStatus = [...this.checkedMarker];
        const index = this.checkedMarker.findIndex((s) => status === s);
        if ($event && index < 0) {
            currentlySelectedStatus.push(status);
        } 
        if (!$event && index > -1) {
            currentlySelectedStatus.splice(index, 1);
        }
        this.setMarkerFilter({ novelItemKey: this.parentKey, enabled: this.markerFilterEnabled, checkedStatus: currentlySelectedStatus })
    }

    toggleStatus(status: STATUS, $event: boolean) {        
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
    
    selected(status: MARKER) {
        return this.checkedMarker.includes(status);
    }

    statusSelected(status: STATUS) {
        return this.checkedStatus.includes(status);
    }

    toggleTagFilter($event) {
        this.setTagFilter({ novelItemKey: this.parentKey, enabled: $event, tags: this.selectedTags });
    }

    toggleMarkerFilter($event) {
        this.setMarkerFilter({ novelItemKey: this.parentKey, enabled: $event, checkedStatus: []})
    }

    toggleStatusFilter($event) {
        this.setStatusFilter({ novelItemKey: this.parentKey, enabled: $event, checkedStatus: []})
    }

    updateTags($event) {
        this.setTagFilter({ novelItemKey: this.parentKey, enabled: this.tagFilterEnabled, tags: $event});
    }

    get allMarkers() {
        return getAllEnumValues(MARKER);
    }

    get allStatus() {
        return [0, 1, 2, 3, 4, 5];
    }

    get checkedMarker() {
        return this.markerFilterSettings.status || [];
    }    
    
    get checkedStatus() {
        return this.statusFilterSettings.status || [];
    }

    get todoChecked() {
        return this.markerFilterSettings.status.includes(MARKER.TODO);
    }
    get fixmeChecked() {
        return this.markerFilterSettings.status.includes(MARKER.FIXME);
    }
    get ideaChecked() {
        return this.markerFilterSettings.status.includes(MARKER.IDEA);
    }

    get markerFilterSettings(): MarkerFilterSetting {
        return this._markerFilterSettings[this.parentKey] || {} as MarkerFilterSetting;
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