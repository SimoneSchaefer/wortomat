<template>
  <div class="tree-view-item" :id="`child-${element.id}`" :class="{ selected: selected }">
    <WConfirmDialog ref="confirmDeleteChild" @accept="deleteChild" message="delete_confirm"></WConfirmDialog>
    <div class="tree-view-item-child">
      <div class="link">
        <div class="plotline" :style="{ 'background-color': getPlotlineColor() }"></div>
        <a href="#" @click="select" :title="$t(`sub_menu.${parentKey}.select_child`)" :key="element.id"><b>
            <WMissingValueTolerantLabel :value="translatedName" :fallback="$t(`fallback_labels.no_name.${childKey}`)">
            </WMissingValueTolerantLabel>&nbsp;
          </b>
          <i v-if="element.summary && element.summary.length">
            <WMissingValueTolerantLabel :value="translatedSummary" :fallback="$t('fallback_labels.no_summary')">
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
import { namespace } from 's-vuex-class';
import { PARENT_ITEM_KEYS } from '@/store/keys';
import { ParentModel } from '@/models/ParentModel';
import { PlotlineModel } from '@/models/Plotline.model';
import { ChildModel } from '@/models/ChildModel';
const novelDataModule = namespace("novelData");

@Options({
  components: { WMissingValueTolerantLabel, WButton, WConfirmDialog },
  emits: ['delete-child', 'select']
})
export default class TreeviewListItem extends mixins(NovelItemKeyAwareMixin, TodoMarkerAwareMixin, TranslatableNovelItemMixin) {
  @Prop() element!: ChildModel;
  @Prop() selected!: boolean;

  @novelDataModule.State('_novelItems')
  _novelItems!: Map<PARENT_ITEM_KEYS, ParentModel[]>;

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
    return { item: this.element, event: $event };
  }

  getPlotlineColor() {
    return this.item.plotline?.color || '#d2d2d2';
  }

  getAllPlotlineColors() {
    return this.plotlines.map((p) => (p as PlotlineModel).color) || [];
  }
  
  confirmDeleteChild(): void {
    (this.$refs.confirmDeleteChild as WConfirmDialog).getDecision(this.element);
  }
  get plotlines() {
    return this._novelItems.get(PARENT_ITEM_KEYS.PLOTLINES) as PlotlineModel[] || [];
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

.plotline {
  height: 100%;
  flex: 1em 0 0;
}

.link {
  width: 100%;
}

.badges {
  display: flex;
  align-items: center;
}

.badges>* {
  margin: 0.5em;
}

.tree-view-item {
  display: flex;
  padding-right: 1em;
  background: var(--light-background);
  border-right: 1px solid rgba(80, 80, 80, 0.39);
}

.tree-view-item-child {
  display: flex;
  flex-grow: 2;
  justify-content: space-between;
  border-bottom: 1px solid #d2d2d2;

}

.tree-view .tree-view-item-child .link {
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

.link {
  display: flex;
}
</style>
