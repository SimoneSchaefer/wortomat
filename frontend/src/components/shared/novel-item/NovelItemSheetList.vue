<template>
    <div v-for="item in items" :key="item.id">
        <NovelItemSheet 
            :novelItemKey="novelItemKey" 
            :item="item" 
            :service="service"></NovelItemSheet>
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
    @Prop() novelItemKey: NOVEL_ITEM_KEYS;

    get items(): BaseModel[] {
        console.log('ITEMS', this.novelItemKey, getCurrentSelection(this.$store.state, this.novelItemKey).map(bla => bla['name']))
        return getCurrentSelection(this.$store.state, this.novelItemKey);
    }

    get service(): NovelItemService {
        return KEY_TO_SERVICE.get(this.novelItemKey);
    }
}
</script>
