<template>
    <NovelItemSheet 
        :novelItemKey="novelItemKey" 
        :baseModel="research" 
        :includeImageUpload="true" 
        :service="service"></NovelItemSheet>
</template>

<script lang="ts">
import { Options, Vue } from 'vue-class-component';
import { Prop } from 'vue-property-decorator';

import NovelItemSheet from '@/components/shared/novel-item/NovelItemSheet.vue';
import { NOVEL_ITEM_KEYS } from '@/store/keys';
import { ResearchModel } from '@/models/Research.model';
import { ResearchService } from '@/service/Research.service';
import { NovelItemService } from '@/service/NovelItemService';

@Options({
  components: {NovelItemSheet }
})
export default class ResearchSheet extends Vue {
    @Prop() research!: ResearchModel;

    get service(): NovelItemService {
       return new ResearchService();
    }

    get novelItemKey(): NOVEL_ITEM_KEYS {
        return NOVEL_ITEM_KEYS.RESEARCH;
    }
}
</script>