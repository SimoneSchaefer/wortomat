<template>
<div class="editable-tags">
    <InlineEdit @start-edit="onStartEdit" @update="updateTags" @cancel="cancel">
        <template v-slot:editing>
            <AutoComplete :multiple="true" v-model="tagsDraft" :suggestions="filteredTags" @complete="searchTags($event)">
                <template #item="slotProps">
                    <div v-if="slotProps.item.id">{{slotProps.item.name}}</div>
                    <div v-else>Add item: {{slotProps.item.name}}</div>
                </template>
                <template #chip="slotProps">
                    {{ slotProps.value.name }}
                </template>
            </AutoComplete>
        </template>
        <template v-slot:readonly>
            <div class="readonly">
                <div v-if="!tags?.length">
                    <MissingValueTolerantLabel :value="''" :fallback="'No Tags added yet'"></MissingValueTolerantLabel>
                </div>
                <div v-for="tag in tags" :key="tag.id" class="tag-chip">
                    <Chip>
                        {{ tag.name }}
                    </Chip>
                </div>
            </div>
        </template>
    </InlineEdit>
</div>
</template>

<script lang="ts">
import { TagModel } from "@/models/Tag.model";
import { TagService } from "@/service/Tag.service";
import { NOVEL_ITEM_KEYS } from "@/store/keys";
import { Options, Vue } from "vue-class-component";
import { Emit, Prop } from "vue-property-decorator";
import InlineEdit from '@/components/shared/inline-edit/InlineEdit.vue';
import MissingValueTolerantLabel from '@/components/shared/MissingValueTolerantLabel.vue';

@Options({
    components: { InlineEdit, MissingValueTolerantLabel },
    emits: [ 'update-tags' ]
})
export default class EditableTags extends Vue {
    @Prop() tags: TagModel[];

    private tagsDraft = [];
    private filteredTags = [];

    onStartEdit() {
        this.tagsDraft = [...this.tags];
    }

    cancel() {
        this.tagsDraft = this.tags;
    }

    @Emit('update-tags')
    async updateTags() {
        const newTags = [];
        for (let tag of this.tagsDraft) {
            if (!tag.id) {
                tag.novelId = this.$store.state.currentNovel.id;
                tag = await new TagService().create(this.$store.state.currentNovel.id, tag);
                tag = tag.data;
                this.$store.dispatch('addItem', { key: NOVEL_ITEM_KEYS.TAGS, item: tag});
            }
            newTags.push(tag)
        }
        return newTags;
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
.readonly {
    display: flex;
}
.editable {
    z-index: 101;
    position: relative;
    background-color: white;
}
.tag-chip {
    padding-right: 0.3em;
}
</style>