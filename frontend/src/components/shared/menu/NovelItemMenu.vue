<template>
    <div class="menu">
      <Button type="button" @click="toggle" class="p-button-raised p-button-rounded" icon="fa fa-bars"/>
      <Menu ref="menu" :model="menuItems" :popup="true"/>
      <ConfirmDialog ref="confirm" @accept="deleteSelected" message="Are you sure you want to delete the selected chapters?"></ConfirmDialog>
  </div>
</template>


<script lang="ts">
import { Options, Vue } from 'vue-class-component';
import ConfirmDialog from '@/components/shared/ConfirmDialog.vue';
import { NOVEL_ITEM_KEYS } from '@/store/keys';
import Menu from 'primevue/menu';
import { BaseModel } from '@/models/Base.model';
import { Prop } from 'vue-property-decorator';
@Options({
  components: { ConfirmDialog }
})
export default class NovelItemMenu extends Vue {
    @Prop() novelItemKey: NOVEL_ITEM_KEYS;
    @Prop() items: Array<BaseModel>;


    addItem(): void {
        this.$store.dispatch('addItem', { 
        key: this.novelItemKey, 
        novelId: this.$store.state.currentNovel?.id, 
        item: new BaseModel() 
        });
    }

    toggle(event: Event): void {
        (this.$refs.menu as Menu).toggle(event);
    }

    deleteSelected(): void {
        this.$store.dispatch('deleteItems', { 
            key: this.novelItemKey, 
            novelId: this.$store.state.currentNovel?.id,
            items: this.items
        })
    }
 
    get menuItems(): Array<{ label: string, icon: string, command: () => void}> {
        return [
            this.getAddMenuItem(),
            this.getDeleteMenuItem()
        ] 
    }

    private getAddMenuItem() {
        return {
            label: 'Add',
            icon: 'fa fa-plus',
            command: () => {
            this.addItem();
            }
        }
    }

    private getDeleteMenuItem() {
        return {
            label: 'Delete selected',
            icon: 'fa fa-trash',
            disabled: this.$store.getters.currentChapters.length === 0,
            command: () => {
            const selectedItems = this.items;
            if (!selectedItems.length) {
                this.$toast.add({severity:'error', summary: 'Action not possible', detail:'No items have been selected', life: 3000});
            } else {
                (this.$refs.confirm as ConfirmDialog).getDecision();
            }          
            }
        }
    }
}
</script>



<style scoped>
  .menu {
    position:fixed;
    bottom: 20px; 
    left: 20px;
    display: flex;
    width: 20em;
    height: 2.3em;
  }

  .menu Button {
    margin-right: 1em;
  }
</style>