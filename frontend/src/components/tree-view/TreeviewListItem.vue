<template>
    <div class="tree-view-item" :id="`child-${element.id}`" :class="{ selected: selected }">
        <WConfirmDialog ref="confirmDeleteChild" @accept="deleteChild" message="delete_confirm"></WConfirmDialog>
        <a href="#" class="tree-view-item-child"
            @click="select(element)"  
            :key="element.id">
            <WMissingValueTolerantLabel 
                :value="element.name" 
                :fallback="$t(`fallback_labels.no_name.${childKey}`)">
            </WMissingValueTolerantLabel>&nbsp;
            <i v-if="element.summary && element.summary.length">
                <WMissingValueTolerantLabel 
                    :value="element.summary" 
                    :fallback="$t('fallback_labels.no_summary')">
                </WMissingValueTolerantLabel>
            </i>
        </a>  
        <div class="child-options">
            <WButton type="text" color="danger" icon="fa fa-trash"  
                :title="`remove_child.${parentKey}`" 
                @click="confirmDeleteChild(element, $event)">
            </WButton>     
        </div>
    </div>     
</template>

<script lang="ts">
import { Options, Vue } from 'vue-class-component';
import { Emit, Prop } from 'vue-property-decorator';

import { NOVEL_ITEM_KEYS } from '@/store/keys';
import { BaseModel } from '@/models/Base.model';

import WMissingValueTolerantLabel from '@/components/shared/MissingValueTolerantLabel.vue';
import WButton from '@/components/shared/Button.vue';
import WConfirmDialog from '@/components/shared/ConfirmDialog.vue';


@Options({
    components: { WMissingValueTolerantLabel, WButton, WConfirmDialog },
    emits: ['delete-child', 'select']
})
export default class TreeviewHeader extends Vue {
    @Prop() element: BaseModel;
    @Prop() selected: boolean;
    @Prop() parentKey: NOVEL_ITEM_KEYS;
    @Prop() childKey: NOVEL_ITEM_KEYS;

    @Emit('delete-child')
    deleteChild() {
        return this.element;
    }
    
    @Emit('select')
    select() {
        return this.element;
    }

    confirmDeleteChild(): void {
        (this.$refs.confirmDeleteChild as WConfirmDialog).getDecision(this.element);
    }
}
</script>

<style scoped>

.tree-view-item {
  display: flex;
  width: 100%;
  cursor: grab;
  justify-content: space-between;
}

.tree-view-item-header {
  font-weight: bold;
  display: flex;
}
.tree-view-item-child {
  padding-left: 1em;
}
.tree-view .tree-view-item-child a{
  padding: 0.5em;
}

.tree-view.children {
  width: 20em;
}

.tree-view-children-header {
  font-weight: bold;
}

.tree-view-item a {
  text-decoration: none;
  display: block;
  width: 100%;
  padding: 0.8em;
}

.tree-view-item:hover {
  background-color: pink;
}

.selected {
  background-color: pink;
}
</style>
