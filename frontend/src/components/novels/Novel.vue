<template>
    <Card class="novel-card h-100">
        <template #header>
            <!--<ImageGallery :imageUrls="novel.covers" :uploadUrl="getUploadUrl()" @uploadImage="uploadImage" @deleteImage="deleteImage"></ImageGallery>-->
        </template>
        <template #title>
            <div class="p-d-flex p-jc-between">
                <EditableLabel v-bind:value="novel.name" @update-label="updateName" placeHolderTitle="No title added yet."></EditableLabel>
                <div class="option-buttons">
                    <router-link :to="'/write/' + novel.id + '/chapters'">
                        <Button class="p-button-text" icon="pi pi-folder-open" iconPos="right"></Button>
                    </router-link>
                    <Button v-on:click="deleteNovel()" class="p-button-text p-button-danger" icon="pi pi-trash" iconPos="right" title="Delete"></Button>
                </div>  
            </div>        
        </template>
        <template #content>
            <EditableLabel v-bind:value="novel.summary" @update-label="updateSummary" placeHolderTitle="No summary added yet." ></EditableLabel>
        </template>
    </Card>
</template>

<script lang="ts">
import { Options, Vue } from 'vue-class-component';
import { Prop } from 'vue-property-decorator';
import EditableLabel from '../shared/inline-edit/EditableLabel.vue';
import ImageGallery, { ImageParam } from '@/components/shared/images/ImageGallery.vue';
import { NovelService } from '@/service/NovelService';

@Options({
    components: { EditableLabel, ImageGallery }
})  
export default class Novel extends Vue {
  @Prop() novel!: Novel 


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
    this.$store.dispatch('updateNovel', novel) 
  }

  deleteNovel(): void {
    this.$confirm.require({
        message: 'Are you sure you want to proceed?',
        header: 'Confirmation',
        icon: 'pi pi-exclamation-triangle',
        accept: () => {
            this.$store.dispatch('deleteNovel', this.novel)
        }
    });
  }
}
</script>

<style scoped>
.option-buttons {
    width: 5em;
}
</style>