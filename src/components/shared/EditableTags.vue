<template>
<div class="editable-tags">
    <div v-if="editing" class="editable p-d-flex">
        <AutoComplete :multiple="true" v-model="tagsDraft" :suggestions="filteredTags" @complete="searchTags($event)">
            <template #item="slotProps">
                <div v-if="slotProps.item.id">{{slotProps.item.name}}</div>
                <div v-else>Add item: {{slotProps.item.name}}</div>
            </template>
            <template #chip="slotProps">
                {{ slotProps.value.name }}
            </template>
        </AutoComplete>
        <div class="options">
            <Button class="p-button p-button-text" icon="pi pi-check" v-on:click="updateTags()"></Button>            
            <Button class="p-button p-button-text" icon="pi pi-times" v-on:click="cancel()"></Button>            
        </div>
    </div>
    <div v-else v-on:click="startEditMode()" class="p-d-flex">
        <div v-if="!tags?.length">
            no Tags :(
        </div>
        <div v-for="tag in tags" :key="tag.id">
            <Chip>
                {{ tag.name }}
            </Chip>
        </div>
    </div>
</div>
<!-- TODO add backdrop in main vue for reuse, use state to trigger visibility -->
<div class="backdrop" v-if="editing"></div>
</template>

<script lang="ts">
import { TagModel } from "@/models/Tag.model";
import { TagService } from "@/service/Tag.service";
import { NOVEL_ITEM_KEYS } from "@/store/keys";
import { Options, Vue } from "vue-class-component";
import { Emit, Prop } from "vue-property-decorator";

@Options({
    components: { },
    emits: [ 'update-tags' ]
})
export default class EditableTags extends Vue {
    @Prop() tags: TagModel[];

    private tagsDraft = [];
    private editing = false;
    private filteredTags = [];

    cancel() {
        this.editing = false;
    }

    @Emit('update-tags')
    async updateTags() {
        const newTags = [];
        for (let tag of this.tagsDraft) {
            if (!tag.id) {
                tag = await new TagService().create(this.$store.state.currentNovel.id, tag); // TODO add to store
                tag = tag.data;
                this.$store.dispatch('itemAdded', { key: NOVEL_ITEM_KEYS.TAGS, item: tag});
            }
            newTags.push(tag)
        }
        this.editing = false;
        return newTags;
    }

    startEditMode() {
        this.editing = true;
        this.tagsDraft = [...this.tags];
    }

    searchTags($event) {      
        this.filteredTags = this.$store.getters.tags.filter(tag => tag.name.includes($event.query));
        if (!this.filteredTags.find(tag => tag.name === $event.query)) {
            this.filteredTags.splice(0, 0, { id: undefined, name: $event.query });
        }
    }
}
</script>

<style scoped>
.editable {
    z-index: 101;
    position: relative;
    background-color: white;
}
div.backdrop {
    background-color: rgba(0, 0, 0, 0.404);
    position: fixed; 
    top: 0;
    left: 0;
    height: 100%;
    width: 100%;
    z-index: 100;
}
</style>