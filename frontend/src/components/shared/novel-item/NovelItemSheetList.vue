<template>
    <div v-if="!hasChildItems" class="empty">
        <WHelpNote :itemKey="childKey"></WHelpNote>
    </div>
    <div v-else>
        <div v-for="item in selected" :key="item.id">
            <NovelItemSheet :item="item" :novelItemKey="parentKey"></NovelItemSheet>
        </div>
    </div>
</template>

<script lang="ts">
import { mixins, Options } from 'vue-class-component';
import { namespace } from 's-vuex-class';

import EditableLabel from '@/components/forms/inline-edit/EditableLabel.vue';
import NovelItemSheet from '@/components/shared/novel-item/NovelItemSheet.vue';
import { BaseModel } from '@/models/Base.model';
import { PARENT_ITEM_KEYS } from '@/store/keys';
import WHelpNote from '@/components/HelpNote.vue';
import NovelItemKeyAwareMixin from '@/components/mixins/NovelItemKeyAwareMixin';
import FilterAwareMixin from '@/components/mixins/FilterAwareMixin';

const novelDataModule = namespace("novelData");
const selection = namespace("selection");


@Options({
  components: { EditableLabel, NovelItemSheet, WHelpNote }
})
export default class NovelItemSheetList extends mixins(NovelItemKeyAwareMixin, FilterAwareMixin)  {
    @novelDataModule.State('_novelItems')
    novelItems!: Map<PARENT_ITEM_KEYS, BaseModel[]>;
    
    @selection.State('_selectedItemIds')
    selectedItemIds!: Record<PARENT_ITEM_KEYS, number[]>;

    get hasChildItems(): boolean {
      return !!this.getFilteredItems().find(parent => (parent.children || []).length );
    }

    get selectedItems(): number[] {
        return this.selectedItemIds[this.parentKey] || [];
    }

    get selected(): BaseModel[] {
        let allSelectedItems = [];
        for (const item of this.getFilteredItems()) {
            allSelectedItems = allSelectedItems.concat((item['children'] || []).filter(child => this.selectedItems.includes(child.id)));
        }
        return allSelectedItems;        
    }
}
</script>
