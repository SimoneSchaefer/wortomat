<template>
    <WConfirmDialog ref="confirmDeleteParent" @accept="deleteParent" message="delete_confirm"></WConfirmDialog>
    <div class="accordion-header">
        <div class="toggle-button fa"  v-bind:class="{ 'fa-chevron-down': isOpen, 'fa-chevron-right': !isOpen }" @click="toggle"></div>
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
            <WButton type="text" color="danger" icon="fa fa-trash" 
                :title="`remove_parent.${parentKey}`" 
                @click="confirmDeleteParent(item, $event)">
            </WButton>
        </div>
    </div>
</template>

<script lang="ts">
import { Options, Vue } from 'vue-class-component';
import { Emit, Prop } from 'vue-property-decorator';

import { BaseModel } from '@/models/Base.model';
import { NOVEL_ITEM_KEYS } from '@/store/keys';

import WButton from '@/components/shared/Button.vue';
import WConfirmDialog from '@/components/shared/ConfirmDialog.vue';
import WEditableLabel from '@/components/shared/inline-edit/EditableLabel.vue';

@Options({
  components: {
    WButton,
    WEditableLabel,
    WConfirmDialog,
  },
  emits: ['delete-parent', 'update-parent-name', 'add-child', 'toggle']
})
export default class TreeviewHeader extends Vue {
    @Prop() parentKey: NOVEL_ITEM_KEYS;
    @Prop() childKey: NOVEL_ITEM_KEYS;
    @Prop() item: BaseModel;
    @Prop() open: boolean;

    confirmDeleteParent(item, $event): void {
        $event.stopPropagation();
        (this.$refs.confirmDeleteParent as WConfirmDialog).getDecision(item);
    }

    @Emit('toggle')
    toggle() {
        return !this.open;
    }

    @Emit('delete-parent')
    deleteParent() {
        return this.item;
    }

    @Emit('update-parent-name')
    updateParentName(_item: BaseModel, newValue: string) {
        return newValue;
    }

    @Emit('add-child')
    addChild() {
        return this.item;
    }

    get isOpen() {
        return this.open;
    }

    get modalOpen() {
        return this.$store.state.modalIsOpen;
    }   
}
</script>


<style scoped>
.accordion-header {
  display: flex;
  width: 100%;
  align-items: center;
  font-weight: 600;
  background: var(--middle-background);
  border-bottom: 1px solid rgba(53, 53, 53, 0.178);
  border-top: 1px solid rgba(53, 53, 53, 0.178);
  padding-right:1.5em;
    border-right: 1px solid rgba(80, 80, 80, 0.39);

}

.accordion-header .menu {
  width: 2em;
  opacity: 0.5;
  text-align: right;
}

.accordion-header .group-options {
  display: flex; 
}

.toggle-button {
    padding: 1em;
}

.toggle-button:hover {
    cursor: pointer;
}
</style>
