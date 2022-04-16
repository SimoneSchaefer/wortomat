<template>
    <Accordion :open="open" @toggle="toggle">
        <WEditableLabel 
            :value="item.name" 
            :placeHolderTitle="`fallback_labels.no_name.${parentKey}`"
            @update-label="updateParentName(item, $event)" >
        </WEditableLabel>
        <div class="group-options" :class="{ hidden: modalOpen }">
            <WButton type="text" color="primary" icon="fa fa-plus" 
                :title="`add_child.${parentKey}`" 
                @click="addChild">
            </WButton>
        </div>
    </Accordion>
</template>

<script lang="ts">
import { mixins, Options } from 'vue-class-component';
import { Emit, Prop } from 'vue-property-decorator';
import { namespace } from 's-vuex-class';

import { BaseModel } from '@/models/Base.model';
import Accordion from '@/components/tree-view/Accordion.vue';

import WButton from '@/components/forms/Button.vue';
import WConfirmDialog from '@/components/shared/ConfirmDialog.vue';
import WEditableLabel from '@/components/forms/inline-edit/EditableLabel.vue';
import NovelItemKeyAwareMixin from '../mixins/NovelItemKeyAwareMixin';

const applicationStateModule = namespace("applicationState");

@Options({
  components: {
    WButton,
    WEditableLabel,
    WConfirmDialog,
    Accordion
  },
  emits: ['delete-parent', 'update-parent-name', 'add-child', 'toggle']
})
export default class TreeviewHeader extends mixins(NovelItemKeyAwareMixin) {
    @Prop() item: BaseModel;
    @Prop() open: boolean;

    @applicationStateModule.State('_modalOpen')
    modalOpen!: boolean;   

    @Emit('toggle')
    toggle() {
        return !this.open;
    }

    @Emit('update-parent-name')
    updateParentName(_item: BaseModel, newValue: string) {
        return newValue;
    }

    @Emit('add-child')
    addChild() {
        return this.item;
    }
}
</script>

