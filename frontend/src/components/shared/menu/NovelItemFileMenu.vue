<template>
    <Button class="p-button-text p-button-secondary" icon="fa fa-file" type="button" label="File" @click="toggle" />
    <Menu ref="menu" :model="menuItems" :popup="true" />
    <ConfirmDialog ref="confirm" @accept="deleteSelected" message="Are you sure you want to delete the selected items?"></ConfirmDialog>
</template>

<script lang="ts">
import { Options, Vue } from 'vue-class-component';
import { Prop } from 'vue-property-decorator';
import Menu from 'primevue/menu';

import { NOVEL_ITEM_KEYS } from '@/store/keys';
import { BaseModel } from '@/models/Base.model';

import ConfirmDialog from '@/components/shared/ConfirmDialog.vue';
import { getCurrentSelection } from '@/store/getters';
@Options({
  components: { ConfirmDialog }
})
export default class NovelItemMenu extends Vue {
    @Prop() novelItemKey: NOVEL_ITEM_KEYS;

    toggle(event) {
        (this.$refs.menu as Menu).toggle(event);
    }

    get items() {
        return getCurrentSelection(this.$store.state, this.novelItemKey);
    }

    addItem(): void {
        this.$store.dispatch('addItem', { 
            key: this.novelItemKey, 
            novelId: this.$store.state.currentNovel?.id, 
            item: new BaseModel() 
        });
    }

    deleteSelected(): void {
        this.$store.dispatch('deleteItems', { 
            key: this.novelItemKey, 
            novelId: this.$store.state.currentNovel?.id,
            items: this.items
        });
    }
 
    get menuItems(): Array<{ label: string, icon: string}> {
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
            disabled: this.items.length === 0,
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


</style>