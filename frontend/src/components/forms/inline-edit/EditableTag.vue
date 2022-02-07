<template>
    <Chip>
        <span class="label">
            {{ tag.name }}
        </span>
        <Button type="button" @click="confirm" class="p-button-danger p-button-text p-button-rounded" icon="fa fa-trash"/>
    </Chip>
    <ConfirmDialog ref="confirm" @accept="remove"></ConfirmDialog>
</template>


<script lang="ts">
import ConfirmDialog from "@/components/shared/ConfirmDialog.vue";
import { TagModel } from "@/models/Tag.model";
import { NOVEL_ITEM_KEYS } from "@/store/keys";
import { Options, Vue } from "vue-class-component";
import { Prop } from "vue-property-decorator";


@Options({
  components: { ConfirmDialog }
})
export default class EditableTag extends Vue {

    @Prop() tag: TagModel;
    
    get tags(): TagModel[] {
        return this.$store.getters.tags;
    }

    confirm(): void {
        (this.$refs.confirm as ConfirmDialog).getDecision();
    }

    remove(): void {
        this.$store.dispatch('deleteItems', { 
            key: NOVEL_ITEM_KEYS.TAGS, 
            novelId: this.$store.state.currentNovel?.id,
            items: [this.tag]
        })
    }
}
</script>

<style scoped>
.label {
    padding-left: 8px;
}
</style>