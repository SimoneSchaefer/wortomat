<template>
<Card class="novel-card h-100">
    <template #header>
        <!--<ImageGallery :imageUrls="novel.covers" :uploadUrl="getUploadUrl()" @uploadImage="uploadImage" @deleteImage="deleteImage"></ImageGallery>-->
    </template>
    <template #title>
        <div class="p-d-flex p-jc-between">
            <EditableLabel v-bind:value="novel.name" @update-label="updateName" placeHolderTitle="fallback_labels.no_name.novel"></EditableLabel>                
        </div>        
    </template>
    <template #content>
        <EditableLabel v-bind:value="novel.summary" @update-label="updateSummary" placeHolderTitle="fallback_labels.no_summary" ></EditableLabel>
    </template>
    <template #footer>
            <div class="option-buttons">
                <router-link :to="'/write/' + novel.id + '/chapters'">
                    <Button class="p-button-primary" label="Open this novel"></Button>
                </router-link>
                <Button v-on:click="confirm()" class="p-button-danger" title="Delete" label="Delete this novel"></Button>
            </div> 
    </template>
</Card>
<ConfirmDialog ref="confirm" @accept="deleteNovel(novel)"></ConfirmDialog>
</template>

<script lang="ts">
import { Options, Vue } from 'vue-class-component';
import { Prop } from 'vue-property-decorator';
import { namespace } from "s-vuex-class";

import EditableLabel from '@/components/forms/inline-edit/EditableLabel.vue';
import ImageGallery, { ImageParam } from '@/components/shared/images/ImageGallery.vue';
import { NovelModel } from '@/models/Novel.model';
import ConfirmDialog from "@/components/shared/ConfirmDialog.vue";


const novelModule = namespace("novel");

@Options({
    components: { EditableLabel, ImageGallery, ConfirmDialog }
})  
export default class Novel extends Vue {
    @Prop() novel!: Novel 


    confirm(): void {
        (this.$refs.confirm as ConfirmDialog).getDecision();
    }

    /*getUploadUrl(): string {
        return this.service.getUploadUrl(this.novelId, this.item.id);
    }

    get service() {
        return new NovelService();
    }*/

    updateName(title: string): void {
        this.updateNovelProperty('name', title)
    }

    updateSummary(summary: string): void {
        this.updateNovelProperty('summary', summary)
    }

    updateNovelProperty(key: string, value: string): void {
        const novel = Object.assign({}, this.novel);
        novel[key] = value;
        this.updateNovel(novel as any as NovelModel);
    }

    @novelModule.Action
    deleteNovel!: (novel: NovelModel) => Promise<void>;

    @novelModule.Action
    updateNovel!: (novel: NovelModel) => Promise<void>;
}
</script>

<style scoped>
.option-buttons {
    width: 100%;
    display: flex;
    justify-content: center;
}

.option-buttons > * {
    margin-left: 1em;;
}
</style>