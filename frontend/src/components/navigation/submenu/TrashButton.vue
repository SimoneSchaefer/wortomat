<template>
  <!-- <WConfirmDialog
    ref="confirmDeleteParent"
    @cancel="reload"
    @accept="deleteNovelItemParent"
    message="delete_confirm"
  ></WConfirmDialog>-->
  <WConfirmDialog
    ref="confirmDelete"
    @cancel="reload"
    @accept="deleteItem"
    message="delete_confirm"
  ></WConfirmDialog>
  <draggable
    :list="[]"
    class="dropzone trashzone"
    @change="trashDropped"
    :group="{ name: 'trash', put: () => true }"
  >
    <section>
      <div
        class="trash"
        @dragover="trashHovered = true"
        @dragleave="trashHovered = false"
        @dragend="trashHovered = false"
        v-bind:class="{ 'trash-hovered': trashHovered }"
        :title="$t(`sub_menu.${parentKey}.trash`)"
      >
        <span></span>
        <i></i>
      </div>
    </section>
  </draggable>
</template>

<script lang="ts">
import NovelItemKeyAwareMixin from "@/components/mixins/NovelItemKeyAwareMixin";
import { PARENT_ITEM_KEYS } from "@/store/keys";
import { namespace } from "s-vuex-class";
import { mixins, Options } from "vue-class-component";
import WConfirmDialog from "@/components/shared/ConfirmDialog.vue";

const novelDataModule = namespace("novelData");

@Options({
  components: {
    WConfirmDialog,
  },
})
export default class TrashButton extends mixins(NovelItemKeyAwareMixin) {
  trashHovered = false;

  @novelDataModule.Action
  loadNovelItems!: (payload: {
    view: PARENT_ITEM_KEYS;
    novelId: number;
  }) => Promise<void>;

  @novelDataModule.Action
  deleteNovelItemChild!: (payload: {
    view: PARENT_ITEM_KEYS;
    novelItem: number;
  }) => Promise<void>;

  @novelDataModule.Action
  deleteNovelItemParent!: (payload: {
    view: PARENT_ITEM_KEYS;
    novelItem: number;
  }) => Promise<void>;
  /* confirmDeleteParent(item, $event): void {
    (this.$refs.confirmDeleteParent as WConfirmDialog).getDecision(item);
  }

  confirmDeleteChild(item, $event): void {
    $event.stopPropagation();
    (this.$refs.confirmDeleteChild as WConfirmDialog).getDecision(item);
  } */

  deleteItem(item) {
      console.log('DELETE ITEM', item)
    if (item.parentId) {
      this.deleteNovelItemChild({
        view: this.parentKey,
        novelItem: item.id,
      });
    } else {
      this.deleteNovelItemParent({
        view: this.parentKey,
        novelItem: item.id,
      });
    }
  }

  confirmDelete(item): void {
    console.log('confirm ITEM', item);
    (this.$refs.confirmDelete as WConfirmDialog).getDecision(item);
  }

  trashDropped($event) {
    this.trashHovered = false;
    console.log('DROPPED', $event.added.element)
    this.confirmDelete($event.added.element);
  }

  reload() {
    this.loadNovelItems({ view: this.parentKey, novelId: this.novelId });
  }
}
</script>

<style scoped>
section {
  width: 100%;
  height: 100%;
  display: flex;
  align-items: center;
}

.trash {
  background: rgb(173, 35, 35);
  width: 30px;
  height: 40px;
  display: inline-block;
  margin: 0 auto;

  position: relative;
  -webkit-border-bottom-right-radius: 3px;
  -webkit-border-bottom-left-radius: 3px;
  -moz-border-radius-bottomright: 3px;
  -moz-border-radius-bottomleft: 3px;
  border-bottom-right-radius: 3px;
  border-bottom-left-radius: 3px;
}
.trash span {
  position: absolute;
  height: 6px;
  background: rgb(173, 35, 35);
  top: -9px;
  left: -5px;
  right: -5px;

  border-top-left-radius: 5px;
  border-top-right-radius: 5px;
  transform: rotate(0deg);
  transition: transform 250ms;
  transform-origin: 19% 100%;
}
.trash span:after {
  content: "";
  position: absolute;
  width: 13px;
  height: 3px;
  background: rgb(173, 35, 35);
  top: -5px;

  border-top-left-radius: 5px;
  border-top-right-radius: 5px;
  transform: rotate(0deg);
  transition: transform 250ms;
  transform-origin: 19% 100%;
  left: 13px;
}

.trash i {
  position: relative;
  width: 2px;
  height: 25px;
  background: var(--dark-background);
  display: block;
  margin: 7px auto;
  border-radius: 2px;
}
.trash i:after {
  content: "";
  width: 2px;
  height: 25px;
  background: var(--dark-background);
  position: absolute;
  left: -9px;
  border-radius: 2px;
}
.trash i:before {
  content: "";
  width: 2px;
  height: 25px;
  background: var(--dark-background);
  position: absolute;
  right: -9px;
  border-radius: 2px;
}

.trash.trash-hovered span,
.trash:hover span {
  transform: rotate(-45deg);
  transition: transform 250ms;
}
</style>
<style>
.trashzone .sortable-ghost {
  position: absolute;
  visibility: hidden;
  height: 0;
  width: 0;
  z-index: 500;
}

.trashzone .sortable-ghost:before {
  visibility: visible;
  font-weight: 900;
  position: absolute;
  top: 0;
  font-family: "Font Awesome 5 Free";
  content: "\f15c";
  z-index: 500;
  display: flex;
  margin: auto;
  justify-content: center;
  align-content: center;
  align-items: center;
  font-size: 2rem;
  border-radius: 50%;
  width: 4rem;
  height: 4rem;
  background-color: transparent;
  color: #fff;
  /*border: 1px solid gray;*/
}
</style>

