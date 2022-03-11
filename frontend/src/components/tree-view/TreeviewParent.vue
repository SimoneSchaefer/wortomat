<template>
  <Accordion :open="open" @toggle="toggle">
    <template v-slot:header>
      <div class="accordion-header w-100">
        <div class="title">
          <WEditableLabel
            :value="item.name"
            :placeHolderTitle="`fallback_labels.no_name.${parentKey}`"
            @update-label="updateParentName($event)"
          >
          </WEditableLabel>
        </div>
        <div class="options">
          <WButton
            type="text"
            color="primary"
            icon="fa fa-plus"
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
        group="children"
        @end="childMoved($event)"
        :id="`parent-${item.id}`"
      >
        <WTreeviewListItem
          v-for="child in item.children"
          :key="child.id"
          @select="selectChild"
          @deleteChild="deleteChild"
          :element="child"
          :selected="isSelected(child)"
        >
        </WTreeviewListItem>
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
  FilterAwareMixin
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
    console.log("EVENT", $event);
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

<style scoped>
.no-children {
  background: var(--light-background);
  padding: 1em 1em;
  font-style: italic;
  color: rgba(128, 128, 128, 0.411);
}

.accordion-header {
  display: flex;
  justify-content: space-between;
  font-size: 1rem;
}

.accordion-header .title {
  flex-grow: 1;
}

.accordion-header .options {
  flex-grow: 0;
  height: 100%;
}

.accordion-header .options button {
  height: 100%;
}
</style>
