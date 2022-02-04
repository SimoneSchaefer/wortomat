<template>
    <WTreeviewHeader 
        :parentKey="parentKey" 
        :item="item"    
        :open="isOpen"  
        @toggle="toggle"               
        @addChild="addChild"
        @updateParentName="updateParentName($event)"
        @deleteParent="deleteParent">
    </WTreeviewHeader>
    <draggable v-if="open" :list="item['children']" class="list-group" ghost-class="ghost"  group="children" @end="childMoved($event)" :id="`parent-${item.id}`">   
        <WTreeviewListItem v-for="child in item['children']" :key="child.id"
            @select="selectChild"
            @deleteChild="deleteChild"
            :selected="isSelected(child)"
            :element="child" 
            :parentKey="parentKey" 
            :childKey="childKey">
        </WTreeviewListItem>    
    </draggable>
</template>

<script lang="ts">
import { Options, Vue } from 'vue-class-component';
import { Emit, Prop } from 'vue-property-decorator';

import { BaseModel } from '@/models/Base.model';
import { NOVEL_ITEM_KEYS } from '@/store/keys';

import WButton from '@/components/forms/Button.vue';
import WConfirmDialog from '@/components/shared/ConfirmDialog.vue';
import WEditableLabel from '@/components/forms/inline-edit/EditableLabel.vue';

import WTreeviewHeader from '@/components/tree-view/TreeviewHeader.vue';
import WTreeviewListItem from '@/components/tree-view/TreeviewListItem.vue';

@Options({
  components: {
    WButton,
    WEditableLabel,
    WConfirmDialog,
    WTreeviewListItem,
    WTreeviewHeader    
  },
  emits: ['delete-parent', 'update-parent-name', 'add-child', 'delete-child', 'child-moved', 'toggle']
})
export default class TreeviewParent extends Vue {
    @Prop() parentKey: NOVEL_ITEM_KEYS;
    @Prop() childKey: NOVEL_ITEM_KEYS;
    @Prop() item: BaseModel;
    @Prop() open: boolean;

    @Emit('delete-parent')
    deleteParent() {
        return this.item;
    }

    @Emit('delete-child')
    deleteChild(child) {
        return child;
    }

    @Emit('update-parent-name')
    updateParentName(newValue: string) {
        return newValue;
    }

    @Emit('add-child')
    addChild() {
        return this.item;
    }

    @Emit('child-moved')
    childMoved($event) {
        return $event;
    }

    @Emit('toggle')
    toggle($event) {
        return $event;
    }


    isSelected(item: BaseModel) {
        const isSelected = !!this.selectedItems.find(selectedItem => selectedItem === item.id); 
        if (isSelected) {
            this.openParentIfNecessary();
        }
        return isSelected;
    }
    
    selectChild(item: BaseModel) {
        this.$store.dispatch('selectItems', { key: this.childKey, items: [item] });
    }


    get isOpen() {
        return this.open;
    }
    get selectedItems(): number[] {
        return this.$store.state.selection.get(this.childKey) || [];
    }
  
    private openParentIfNecessary() {
        if(!open) {
            this.$emit('toggle', true);
        }
    }

    get modalOpen() {
        return this.$store.state.modalIsOpen;
    }   
}
</script>

