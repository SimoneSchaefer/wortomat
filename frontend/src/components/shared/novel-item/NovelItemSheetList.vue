<template>
    <div v-for="item in selected" :key="item.id">
        <NovelItemSheet 
            :novelItemKey="childKey" 
            :item="item" 
            :service="service">
        </NovelItemSheet>
    </div>
</template>

<script lang="ts">
import { Options, Vue } from 'vue-class-component';
import EditableLabel from '@/components/shared/inline-edit/EditableLabel.vue';
import NovelItemSheet from '@/components/shared/novel-item/NovelItemSheet.vue';
import { BaseModel } from '@/models/Base.model';
import { getCurrentSelection } from '@/store/getters';
import { Prop } from 'vue-property-decorator';
import { NOVEL_ITEM_KEYS } from '@/store/keys';
import { NovelItemService } from '@/service/NovelItemService';
import { KEY_TO_SERVICE } from '@/store/store-api-adapter';

@Options({
  components: { EditableLabel, NovelItemSheet }
})
export default class NovelItemSheetList extends Vue {
    @Prop() parentKey: NOVEL_ITEM_KEYS;
    @Prop() childKey: NOVEL_ITEM_KEYS;

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
            allChapters = allChapters.concat((part[this.childKey] || []).filter(chapter => ids.includes(chapter.id)));
        }
        return allChapters;
    }

}
</script>
