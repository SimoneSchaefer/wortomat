<template>
    <Card>
        <template #header>
            <Galleria :value="novel.covers" :numVisible="5"></Galleria>
        </template>
        <template #title>
            <div class="p-d-flex p-jc-between">
                <EditableLabel v-bind:value="novel.title"></EditableLabel>
                <div>
                    <router-link :to="'/write/' + novel.id + '/chapters'">
                        <Button class="p-button-text" icon="pi pi-folder-open" iconPos="right" ></Button>
                    </router-link>
                    <Button v-on:click="deleteNovel()" class="p-button-text p-button-danger" icon="pi pi-trash" iconPos="right" title="Delete"></Button>
                </div>  
            </div>        
        </template>
        <template #content>
            <EditableLabel v-bind:value="novel.summary"></EditableLabel>
        </template>
    </Card>
</template>

<script lang="ts">
import { Options, Vue } from 'vue-class-component';
import { Emit, Prop } from 'vue-property-decorator';
import EditableLabel from '../shared/EditableLabel.vue';

@Options({
    components: { EditableLabel }
})  
export default class Novel extends Vue {
  @Prop() novel!: any 

  deleteNovel() {
    this.$confirm.require({
        message: 'Are you sure you want to proceed?',
        header: 'Confirmation',
        icon: 'pi pi-exclamation-triangle',
        accept: () => {
            this.confirmDeleteNovel();
        }
    });
  }

  @Emit('delete-novel')
  confirmDeleteNovel() {
      return this.novel;
  }
}
</script>
