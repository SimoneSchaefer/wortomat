<template>
    <Dropdown v-model="selected" :options="items" optionLabel="name" :filter="true" :placeholder="$t(placeHolder)">
    <template #value="slotProps">
        <div v-if="slotProps.value">
            <WMissingValueTolerantLabel :value="slotProps.value.name" :fallback="$t(`fallback_labels.no_name.${novelItemKey}`)"></WMissingValueTolerantLabel>
            <i v-if="slotProps.value?.summary">{{ slotProps.summary }} </i>
        </div>
        <span v-else>
            {{slotProps.placeholder}}
        </span>
    </template>
    <template #option="slotProps">
        <div class="w-dropdown-option">
            <WMissingValueTolerantLabel :value="slotProps.option.name" :fallback="$t(`fallback_labels.no_name.${novelItemKey}`)"></WMissingValueTolerantLabel>
            <i v-if="slotProps.option?.summary"> - {{ slotProps.option.summary }} </i>
        </div>
    </template>               
    
</Dropdown>
</template>


<script lang="ts">
import { Options, Vue } from 'vue-class-component';
import { Prop } from 'vue-property-decorator';

import WMissingValueTolerantLabel from '@/components/shared/MissingValueTolerantLabel.vue';
import { BaseModel } from '@/models/Base.model';
import { NOVEL_ITEM_KEYS } from '@/store/keys';
@Options({
  components: { WMissingValueTolerantLabel },
  emits: ['change']
})
export default class NovelItemDropdown extends Vue {
    @Prop() selectedItem: BaseModel  = null;
    @Prop() novelItemKey: NOVEL_ITEM_KEYS;
    @Prop() items: BaseModel;
    @Prop() placeHolder: string;

    get selected() {
        return this.selectedItem;
    }

    set selected($event) {    
        this.$emit('change', $event);
    }
}
</script>