<template>
    <Dialog v-model:visible="editing" :modal="true">
        <template #header>
            <h3>{{ header }}</h3>
        </template>
        <Editor v-model="draft" @text-change="onInput"/>
        <template #footer>
            <Button label="Cancel" v-on:click="cancel"></Button>
            <Button label="Save" v-on:click="updateText"></Button>
        </template>
    </Dialog>
    <div class="content" v-on:dblclick="startEditMode()" v-html="value"></div>
</template>


<script lang="ts">
import { Options, Vue } from 'vue-class-component';
import { Emit, Prop } from 'vue-property-decorator';

@Options({
    emits: [ 'update-text' ]
})  
export default class EditableLabel extends Vue {
  @Prop() header!: string; 
  @Prop() value!: string; 

  private editing = false;
  private draft: string | null = null;

  startEditMode() {
    this.editing = true;
    this.draft = this.value;
  }

  cancel() {
      if (this.draft !== this.value) {
        this.$confirm.require({
            message: 'Are you sure you want to proceed?',
            header: 'Confirmation',
            icon: 'pi pi-exclamation-triangle',
            accept: () => {
                this.discard();
            }
        });
      } else {
        this.discard();
      }    
  }

  onInput(event) {
      this.draft = event.htmlValue
  }


  private discard() {
        this.draft = this.value;
        this.editing = false;
  }

  @Emit('update-text')
  updateText() {
      this.editing = false;
      return this.draft;
  }
}
</script>


<style scoped>
.content {
    text-align: left;
}
.btn-group {

}
</style>
