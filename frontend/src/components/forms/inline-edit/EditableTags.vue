<template>
<div class="editable-tags">
    <InlineEdit @start-edit="onStartEdit" @update="updateTags" @cancel="cancel">
        <template v-slot:editing>
            <AutoComplete :multiple="true" v-model="tagsDraft" :suggestions="filteredTags" @complete="searchTags($event)" ref="editableRef" >
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
                <div v-if="!selectedTags?.length"  class="underline">
                    <MissingValueTolerantLabel :value="''" :fallback="'No Tags added yet'"></MissingValueTolerantLabel>
                </div>
                <div v-for="tag in selectedTags" :key="tag.id" class="tag-chip">
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

import { mixins, Options } from "vue-class-component";
import { Emit, Prop } from "vue-property-decorator";
import { namespace } from "s-vuex-class";

import { TagModel } from "@/models/Tag.model";
import { PARENT_ITEM_KEYS } from "@/store/keys";
import { GroupingNovelItemService } from "@/service/GroupingNovelItemService";

import InlineEdit from '@/components/forms/inline-edit/InlineEdit.vue';
import MissingValueTolerantLabel from '@/components/shared/MissingValueTolerantLabel.vue';
import NovelItemKeyAwareMixin from "@/components/mixins/NovelItemKeyAwareMixin";


const novelDataModule = namespace("novelData");

@Options({
    components: { InlineEdit, MissingValueTolerantLabel },
    emits: [ 'update-tags' ]
})
export default class EditableTags extends mixins(NovelItemKeyAwareMixin) {
    @Prop() novelItemKey: PARENT_ITEM_KEYS;
    @Prop() selectedTags: TagModel[];
    @Prop() addNewTagPossible: boolean;
   
    @novelDataModule.State('_tags')
    tags!: Map<PARENT_ITEM_KEYS,TagModel[]>; 
   
    @novelDataModule.Mutation
    tagAdded!: (update: { view: PARENT_ITEM_KEYS, tag: TagModel}) => Promise<void>; 

    private tagsDraft = [];
    private filteredTags = [];
    private service = new GroupingNovelItemService();


    onStartEdit(): void {
        this.tagsDraft = [...(this.selectedTags || [])];
        setTimeout(() => {
            (this.$refs.editableRef as HTMLInputElement).focus();
        }, 0);
    }

    cancel(): void {
        this.tagsDraft = this.selectedTags;
    }

    @Emit('update-tags')
    async updateTags(): Promise<TagModel[]> {
        const newTags = [];
        for (let tag of this.tagsDraft) {
            tag.novelId = this.novelId;
            if (!tag.id) {
                tag = await this.service.createTag(this.novelItemKey, this.novelId, tag);
                tag = tag.data;
                this.tagAdded({ view: this.novelItemKey, tag: tag });
            }
            newTags.push(tag)
        }
        return newTags;
    }

    searchTags($event: { query: string }): void { 
        this.filteredTags = (this.tags.get(this.novelItemKey) || []).filter(tag => tag.name.toLocaleLowerCase().includes($event.query.toLocaleLowerCase()));
        if (!this.addNewTagPossible) {
            return;
        }
        if (!this.filteredTags.find(tag => tag.name.toLocaleLowerCase() === $event.query.toLocaleLowerCase())) {
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

<style>
.editable-tags span.p-autocomplete {
    display: block;
}
</style>