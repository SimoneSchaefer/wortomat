<template>
    <NovelItemSheet 
        :novelItemKey="novelItemKey" 
        :baseModel="character" 
        :includeImageUpload="true" 
        :service="service"></NovelItemSheet>
</template>

<script lang="ts">
import { Options, Vue } from 'vue-class-component';
import { Prop } from 'vue-property-decorator';

import NovelItemSheet from '@/components/shared/novel-item/NovelItemSheet.vue';
import { CharacterModel } from '@/models/Character.model';
import { NOVEL_ITEM_KEYS } from '@/store/keys';
import { NovelItemService } from '@/service/NovelItemService';
import { CharacterService } from '@/service/Character.service';

@Options({
  components: {NovelItemSheet }
})
export default class CharacterSheet extends Vue {
    @Prop() character!: CharacterModel;

    get novelItemKey(): NOVEL_ITEM_KEYS {
        return NOVEL_ITEM_KEYS.CHARACTERS;
    }
    
    get service(): NovelItemService {
       return new CharacterService();
    }
}
</script>
