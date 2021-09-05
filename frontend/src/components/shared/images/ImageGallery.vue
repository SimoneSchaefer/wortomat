<template>
<div class="file-container">
    <Galleria :value="imageUrls" :showItemNavigators="true" :showThumbnails="false">
        <template #item="slotProps">
            <div>
                <div class="file-options">
                    <Button v-on:click="openImage(slotProps.item.imageUrl)" class="p-button-primary p-button-text" icon="fa fa-external-link-alt" title="Open image in new tab" :href="slotProps.item" target="_blank"></Button>
                    <Button v-on:click="confirm" class="p-button-danger p-button-text" icon="fa fa-trash" title="Delete this image"></Button>
                    <ConfirmDialog ref="confirm" @accept="deleteImage(slotProps.item)"></ConfirmDialog>
                </div>
                <img :src="`${slotProps.item.imageUrl}`" />
            </div>
        </template>
    </Galleria> 
    <div class="upload">
        <FileUpload ref="fileupload" name="upload[]" mode="basic" accept="image/*" :auto="true"  :customUpload="true" @uploader="customUpload" :chooseLabel="'Upload'"></FileUpload>
    </div>
</div>
          
</template>

<script lang="ts">
import { Options, Vue } from 'vue-class-component';
import { Emit, Prop } from 'vue-property-decorator';

import ConfirmDialog from "@/components/shared/ConfirmDialog.vue";
import FileUpload from 'primevue/fileupload';


@Options({
  components: { ConfirmDialog },
  emits: [ 'delete-image', 'upload-image']
})
export default class CharacterSheet extends Vue {
    @Prop() imageUrls!: Array<ImageParam>;
    @Prop() uploadUrl!: string;

    customUpload(event) {
        let xhr = new XMLHttpRequest();
        let formData = new FormData();

        for (let file of event.files) {
            formData.append('upload[]', file, file.name);
        }


        xhr.onreadystatechange = () => {
            if (xhr.readyState === 4) {
                if (xhr.status >= 200 && xhr.status < 300) {
                    console.log(':) :) :) ', xhr);
                    this.$emit('upload-image', JSON.parse(xhr.response));
                }
                else {
                    console.log(':( :( :(');
                }

                (this.$refs.fileupload as any).clear();
            }
        };

        xhr.open('POST', this.uploadUrl, true);
        xhr.withCredentials = false;
        xhr.send(formData);
    }

    openImage(url: string): void {
        window.open(url, 'blank');
    }

    @Emit('upload-image')
    uploadImage(image): ImageParam {
        console.log('UPLOADED', image)
        return image;
    }

    @Emit('delete-image')
    deleteImage(image: ImageParam): ImageParam {
        console.log('EMIT DELETE')
        return image;
    }

    confirm(): void {
        (this.$refs.confirm as ConfirmDialog).getDecision();
    }
}

export interface ImageParam {
    imageId: number, 
    imageUrl: string
}
</script>

<style>
.file-container {
    width: calc(200px + 8rem);
}
.file-options {
    display: flex;
    flex-direction: row;
    justify-content: flex-end;
    background-color: rgb(59, 59, 59);
    width: 100%;
    padding: 1em 0;
}

.file-options > * {
    padding-right: 1em;
}

.upload {
    padding: 1rem;
    display: flex;
    justify-content: center;
}

.p-galleria {
    height: 270px;
}
.p-galleria-item-container,.file-container  {
    background-color: rgb(59, 59, 59);
}

.p-galleria .p-galleria-item-container .p-galleria-item-nav {
    margin: 0;
    height: 100%;
    top: 0;
}

.p-galleria img {
    width: 200px;
    height: 200px;
}


</style>