<template>
<div class="file-container">
    <Galleria :value="images" :showItemNavigators="true" :showThumbnails="false">
        <template #item="slotProps">
            <div v-if="isDummy(slotProps.item)">
                <img :src="`${slotProps.item.imageUrl}`" class="dummy-image" />
            </div>
            <div v-if="!isDummy(slotProps.item)">
                <div class="file-options">
                    <Button v-on:click="confirm" class="p-button-danger" icon="fa fa-trash" title="Delete this image"></Button>
                    <ConfirmDialog ref="confirm" @accept="deleteImage(slotProps.item)"></ConfirmDialog>
                </div>
                <a :href="slotProps.item.imageUrl" target="_blank" title="View in in new tab">
                    <img :src="`${slotProps.item.imageUrl}`" v-bind:class="{ dummy: isDummy(slotProps.item) }" />
                </a>
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
import { NOVEL_ITEM_KEYS } from '@/store/keys';


@Options({
  components: { ConfirmDialog },
  emits: [ 'delete-image', 'upload-image']
})
export default class ImageGallery extends Vue {
    @Prop() imageUrls: Array<ImageParam>;
    @Prop() uploadUrl!: string;
    @Prop() novelItemKey: NOVEL_ITEM_KEYS;

    get images() {
        if (this.imageUrls.length) {
            return this.imageUrls;
        }
        return [{
                imageId: undefined,
                imageUrl: `/assets/images/dummy-gallery-item/${this.novelItemKey}.jpg`
        }];
    }

    isDummy(image: ImageParam) {
        return typeof image.imageId === 'undefined';
    }

    customUpload(event) {
        let xhr = new XMLHttpRequest();
        let formData = new FormData();

        for (let file of event.files) {
            formData.append('upload[]', file, file.name);
        }


        xhr.onreadystatechange = () => {
            if (xhr.readyState === 4) {
                if (xhr.status >= 200 && xhr.status < 300) {
                    this.$emit('upload-image', JSON.parse(xhr.response));
                }
                else {
                    this.$toast.add({severity:'error', summary: 'Could not upload image', life: 10000});
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
        return image;
    }

    @Emit('delete-image')
    deleteImage(image: ImageParam): ImageParam {
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
.dummy-image {
    filter: grayscale(100%);
}

.file-options {
    position: absolute;
    display: flex;
    flex-direction: row;
    justify-content: flex-end;
    right: 2.8rem;
    padding: 0;
}

.file-options > * {
    padding-right: 1em;
}

.upload {
    position: relative;
    top: -1rem;
    display: flex;
    justify-content: center;
}

.p-galleria .p-galleria-item-container {
    width: 20rem;
    height: 14rem;
}

.p-galleria .p-galleria-item-nav .p-galleria-item-prev-icon, 
.p-galleria .p-galleria-item-nav .p-galleria-item-next-icon {
    color: rgb(132, 132, 132);
}

.p-galleria .p-galleria-item-nav.p-link:focus {
    outline: none;
    box-shadow: none;;
}

.p-galleria .p-galleria-item-container .p-galleria-item-nav {
    margin: 0;
    height: 100%;
    top: 0;
}

.p-galleria img {
    width: 14em;
    height: 14em;
    object-fit: cover;
}


</style>