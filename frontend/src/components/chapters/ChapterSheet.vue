<template>
    <NovelItemSheet 
        :novelItemKey="novelItemKey" 
        :baseModel="chapter" 
        :includeImageUpload="false" 
        :service="service"></NovelItemSheet>
</template>

<script lang="ts">
import { Options, Vue } from 'vue-class-component';
import { Prop } from 'vue-property-decorator';
import { ChapterModel } from '@/models/Chapter.model';
import { NOVEL_ITEM_KEYS } from '@/store/keys';
import { NovelItemService } from '@/service/NovelItemService';
import { ChapterService } from '@/service/Chapter.service';
import NovelItemSheet from '@/components/shared/novel-item/NovelItemSheet.vue';

@Options({
  components: { NovelItemSheet}
})
export default class ChapterSheet extends Vue {
    @Prop() chapter!: ChapterModel;

    get novelItemKey(): NOVEL_ITEM_KEYS {
        return NOVEL_ITEM_KEYS.CHAPTERS;
    }

    get service(): NovelItemService {
        return new ChapterService();
    }
}
</script>
