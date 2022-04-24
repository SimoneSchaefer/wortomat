<template>
  <Accordion :open="open" @toggle="toggle">
    <template v-slot:header>
      <div class="parent-header w-100">
        <div class="title">
          <WEditableLabel
            :value="translatedName"
            :placeHolderTitle="`fallback_labels.no_name.${parentKey}`"
            @update-label="updateParentName($event)"
          >
          </WEditableLabel>
        </div>
        <div class="options">
          <WButton
            color="primary"
            icon="fa fa-plus"
            :rounded="true"
            :title="`add_child.${parentKey}`"
            @click="addChild"
          >
          </WButton>
        </div>
      </div>
    </template>
    <template v-slot:content>
      <draggable
        :list="item['children']"
        class="list-group"
        ghost-class="ghost"
        drag-class="dragging"
        group="children"
        @end="childMoved($event)"
        :id="`parent-${item.id}`"
      >
        <transition-group type="transition" :name="!drag ? 'flip-list' : null">
          <WTreeviewListItem
            v-for="child in item.children"
            :key="child.id"
            @select="selectChild"
            @deleteChild="deleteChild"
            :element="child"
            :selected="isSelected(child)"
          >
          </WTreeviewListItem>
        </transition-group>
      </draggable>
      <div v-if="item['children'].length === 0 && open" class="no-children">
        {{ $t("no_children") }}
      </div>
    </template>
  </Accordion>
</template>

<script lang="ts">
import { mixins, Options } from "vue-class-component";
import { Emit, Prop } from "vue-property-decorator";
import { namespace } from "s-vuex-class";

import { BaseModel } from "@/models/Base.model";
import { PARENT_ITEM_KEYS } from "@/store/keys";

import WButton from "@/components/forms/Button.vue";
import WConfirmDialog from "@/components/shared/ConfirmDialog.vue";
import WEditableLabel from "@/components/forms/inline-edit/EditableLabel.vue";

import Accordion from "@/components/tree-view/Accordion.vue";
import WTreeviewHeader from "@/components/tree-view/TreeviewHeader.vue";
import WTreeviewListItem from "@/components/tree-view/TreeviewListItem.vue";
import NovelItemKeyAwareMixin from "../mixins/NovelItemKeyAwareMixin";
import FilterAwareMixin from "../mixins/FilterAwareMixin";
import TranslatableNovelItemMixin from "../mixins/TranslatableNovelItemMixin";
import { ParentModel } from "@/models/ParentModel";

const selectionModule = namespace("selection");
const applicationStateModule = namespace("applicationState");

@Options({
  components: {
    WButton,
    WEditableLabel,
    WConfirmDialog,
    WTreeviewListItem,
    WTreeviewHeader,
    Accordion,
  },
  emits: [
    "delete-parent",
    "update-parent-name",
    "add-child",
    "delete-child",
    "child-moved",
    "toggle",
    "select-child",
  ],
})
export default class TreeviewParent extends mixins(
  NovelItemKeyAwareMixin,
  FilterAwareMixin,
  TranslatableNovelItemMixin
) {
  @Prop() item: ParentModel;
  @Prop() open: boolean;

  @applicationStateModule.State("_modalOpen")
  modalOpen!: boolean;

  @selectionModule.State("_selectedItemIds")
  _selectedItemIds!: Record<PARENT_ITEM_KEYS, number[]>;

  @selectionModule.Action
  selectItemIds!: (payload: {
    view: PARENT_ITEM_KEYS;
    itemIds: number[];
  }) => Promise<void>;

  @Emit("delete-parent")
  deleteParent() {
    return this.item;
  }

  @Emit("delete-child")
  deleteChild(child) {
    return child;
  }

  @Emit("update-parent-name")
  updateParentName(newValue: string) {
    console.log("NEW VALUE", newValue);
    return newValue;
  }

  @Emit("add-child")
  addChild() {
    return this.item;
  }

  @Emit("child-moved")
  childMoved($event) {
    return $event;
  }

  @Emit("toggle")
  toggle($event) {
    return $event;
  }

  @Emit("select-child")
  selectChild($event) {
    return $event;
  }

  isSelected(item: BaseModel) {
    const isSelected = (this._selectedItemIds[this.parentKey] || []).find(
      (id) => id === item.id
    );
    if (isSelected) {
      this.openParentIfNecessary();
    }
    return isSelected;
  }

  private openParentIfNecessary() {
    if (!open) {
      this.$emit("toggle", true);
    }
  }
}
</script>

<style>
.dragging {
  opacity: 0;
}

.trashzone .sortable-ghost {
  position: absolute;
  visibility: hidden;
}

.trashzone .sortable-ghost:before {
  visibility: visible;
  font-weight: 900;
  font-family: "Font Awesome 5 Free";
  content: "\f1d8";
  display: flex;
  margin: auto;
  justify-content: center;
  align-content: center;
  align-items: center;
  font-size: 2rem;
  border-radius: 50%;
  width: 4rem;
  height: 4rem;
  background-color: rgba(255, 121, 121, 0.452);
  color: gray;
}
</style>

<style scoped>
.no-children {
  background: var(--light-background);
  padding: 1em 1em;
  font-style: italic;
  color: rgba(128, 128, 128, 0.411);
}

.parent-header {
  display: flex;
  justify-content: space-between;
  font-size: 1rem;
  height: 100%;
  align-items: center;
}

.parent-header .title {
  flex-grow: 1;
}

.parent-header .options {
  flex-grow: 0;
  height: 100%;
}

.parent-header .options button {
  height: 100%;
}
</style>
