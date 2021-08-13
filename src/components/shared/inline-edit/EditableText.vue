<template>
    <Dialog v-model:visible="editing" 
    :modal="true" 
    :closeOnEscape="false" 
    :closable="false" 
    :draggable="false"
    :style="{ 'width': 'calc(100% - 5em)', 'max-width': '80em', 'text-align': 'left'  }">
        <TipTap :content="value" ref="editorRef"/>
        <template #footer>
            <Button label="Cancel" v-on:click="cancel"></Button>
            <Button label="Save" v-on:click="updateText"></Button>
        </template>
    </Dialog>
    <div class="content" v-on:click="startEditMode()" v-html="value"></div>
</template>


<script lang="ts">
import { Options, Vue } from 'vue-class-component';
import { Emit, Prop } from 'vue-property-decorator';
import TipTap from '../TipTap.vue'

@Options({
    components: { TipTap },
    emits: [ 'update-text' ]
})  
export default class EditableLabel extends Vue {
  @Prop() header!: string; 
  @Prop() value!: string; 

  private editing = false;

  startEditMode() {
    this.editing = true;
  }

  cancel() {
      const updatedContent = this.getCurrentContent();
      if (updatedContent !== this.value) {
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

  private discard() {
        this.editing = false;
  }

  @Emit('update-text')
  updateText() {
      const updatedContent = this.getCurrentContent();
      this.editing = false;
      return updatedContent;
  }

  private getCurrentContent() {
      return (this.$refs.editorRef as any).editor.getHTML();
  }
}
</script>


<style scoped>
.content {
    text-align: left;   
    border: 3px solid transparent;
    padding-top: 0.5em; 
}
div.content:hover {
    cursor: url('/@assets/cursors/edit.png') 1 30, pointer;
    background: aliceblue;
    border: 3px dotted gray;
}
</style>
