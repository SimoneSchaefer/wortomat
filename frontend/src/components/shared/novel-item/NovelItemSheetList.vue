<template>
    <div v-if="!hasChildItems" class="empty">
        <WHelpNote :itemKey="childKey"></WHelpNote>
    </div>
    <div v-else>
        <div v-for="item in selected" :key="item.id">
            <NovelItemSheet 
                :novelItemKey="childKey" 
                :item="item" 
                :service="service">
            </NovelItemSheet>
        </div>
    </div>
</template>

<script lang="ts">
import { Options, Vue } from 'vue-class-component';
import EditableLabel from '@/components/shared/inline-edit/EditableLabel.vue';
import NovelItemSheet from '@/components/shared/novel-item/NovelItemSheet.vue';
import { BaseModel } from '@/models/Base.model';
import { Prop } from 'vue-property-decorator';
import { NOVEL_ITEM_KEYS } from '@/store/keys';
import { NovelItemService } from '@/service/NovelItemService';
import { KEY_TO_CHILD, KEY_TO_SERVICE } from '@/store/store-api-adapter';
import { getAllItems } from '@/store/getters';
import WHelpNote from '@/components/HelpNote.vue';

@Options({
  components: { EditableLabel, NovelItemSheet, WHelpNote }
})
export default class NovelItemSheetList extends Vue {
    @Prop() parentKey: NOVEL_ITEM_KEYS;
    @Prop() childKey: NOVEL_ITEM_KEYS;

    get hasChildItems(): boolean {
      return !!(getAllItems(this.$store.state, this.parentKey).find(parent => (parent['children'] || []).length ));
    }

    get service(): NovelItemService {
        return KEY_TO_SERVICE.get(this.childKey);
    }

    get selectedItems(): number[] {
        return this.$store.state.selection.get(this.childKey) || [];
    }

    get selected(): BaseModel[] {
        const ids = this.selectedItems;
        const all = this.$store.state.novelItems.get(this.parentKey) || [];
        let allChapters = [];
        for (let part of all) {
            allChapters = allChapters.concat((part['children'] || []).filter(chapter => ids.includes(chapter.id)));
        }
        return allChapters;        
    }

}
</script>
