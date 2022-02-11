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

const novelDataModule = namespace("novelData");
const selection = namespace("selection");


@Options({
  components: { EditableLabel, NovelItemSheet, WHelpNote }
})
export default class NovelItemSheetList extends mixins(NovelItemKeyAwareMixin)  {
    @novelDataModule.State('_novelItems')
    novelItems!: Map<PARENT_ITEM_KEYS, BaseModel[]>;
    
    @selection.State('_selectedItemIds')
    selectedItemIds!: Map<PARENT_ITEM_KEYS, number[]>;

    get items() {
        return this.novelItems.get(this.parentKey) || [];
    }

    get hasChildItems(): boolean {
      return !!this.items.find(parent => (parent['children'] || []).length );
    }

    get selectedItems(): number[] {
        return this.selectedItemIds.get(this.parentKey) || [];
    }

    get selected(): BaseModel[] {
        let allSelectedItems = [];
        for (let part of this.novelItems.get(this.parentKey)) {
            allSelectedItems = allSelectedItems.concat((part['children'] || []).filter(chapter => this.selectedItems.includes(chapter.id)));
        }
        return allSelectedItems;        
    }
}
</script>
