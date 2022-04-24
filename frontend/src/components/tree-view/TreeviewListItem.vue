<template>
    <div class="tree-view-item" :id="`child-${element.id}`" :class="{ selected: selected }">
        <WConfirmDialog ref="confirmDeleteChild" @accept="deleteChild" message="delete_confirm"></WConfirmDialog>
         <div class="tree-view-item-child">
            <div class="link">
              <a href="#"
                  @click="select"  
                  :title="$t(`sub_menu.${parentKey}.select_child`)"
                  :key="element.id">
                  <WMissingValueTolerantLabel 
                      :value="translatedName" 
                      :fallback="$t(`fallback_labels.no_name.${childKey}`)">
                  </WMissingValueTolerantLabel>&nbsp;
                  <i v-if="element.summary && element.summary.length">
                      <WMissingValueTolerantLabel 
                          :value="translatedSummary" 
                          :fallback="$t('fallback_labels.no_summary')">
                      </WMissingValueTolerantLabel>
                  </i>
              </a> 
            </div>
                    
            <div class="badges">
              <Badge v-if="getTodoCount(element.content)" :value="getTodoCount(element.content)" severity="warning"></Badge>
              <Badge v-if="getFixmeCount(element.content)" :value="getFixmeCount(element.content)" severity="danger"></Badge>
              <Badge v-if="getIdeaCount(element.content)" :value="getIdeaCount(element.content)" severity="info"></Badge>
            </div>
          </div>
    </div>     
</template>

<script lang="ts">
import { mixins, Options } from 'vue-class-component';
import { Emit, Prop } from 'vue-property-decorator';

import { BaseModel } from '@/models/Base.model';

import WMissingValueTolerantLabel from '@/components/shared/MissingValueTolerantLabel.vue';
import WButton from '@/components/forms/Button.vue';
import WConfirmDialog from '@/components/shared/ConfirmDialog.vue';
import NovelItemKeyAwareMixin from '@/components/mixins/NovelItemKeyAwareMixin';
import TodoMarkerAwareMixin from '@/components/mixins/TodoMarkerAwareMixin';
import TranslatableNovelItemMixin from "../mixins/TranslatableNovelItemMixin";

@Options({
    components: { WMissingValueTolerantLabel, WButton, WConfirmDialog },
    emits: ['delete-child', 'select']
})
export default class TreeviewListItem extends mixins(NovelItemKeyAwareMixin, TodoMarkerAwareMixin, TranslatableNovelItemMixin) {
    @Prop() element!: BaseModel;
    @Prop() selected!: boolean;

    get item() {
      return this.element;
    }

    @Emit('delete-child')
    deleteChild() {
        return this.element;
    }
    
    @Emit('select')
    select($event) {
      $event.preventDefault();
      $event.stopPropagation();
      return { item: this.element, event: $event};
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

.badges {
  display: flex;
  align-items: center;
}

.badges > * {
  margin: 0.5em;
}
.tree-view-item {
  display: flex;
  padding-right: 1em;
  background: var(--light-background);
  border-right: 1px solid rgba(80, 80, 80, 0.39);
}

.tree-view-item-child {
  padding-left: 1em;
  display: flex;
  flex-grow: 2;
  justify-content: space-between;

}
.tree-view .tree-view-item-child .link{
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
  background: none;
  background-color: aliceblue;
}

.tree-view-item.selected {
  background: none;
  background-color: rgb(202, 230, 255);
}
</style>
