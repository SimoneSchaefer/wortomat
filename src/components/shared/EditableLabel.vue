<!-- template -->
<template>
    <div class="container p-d-flex p-jc-between" v-bind:class=" { editing: editing}">
        <div class="label" contenteditable="true" v-if="editing" @input="onInput">{{ value }}</div>
        <div class="label" v-on:dblclick="startEditMode()" contenteditable="false" v-else>{{ value }}</div>
        <div class="options" v-if="editing">
            <Button class="p-button p-button-text" icon="pi pi-check" v-on:click="updateLabel()"></Button>            
            <Button class="p-button p-button-text" icon="pi pi-times" v-on:click="cancel()"></Button>            
        </div>
    </div>
    <div class="backdrop" v-if="editing"></div>
    
</template>


<!-- code -->
<script lang="ts">
import { Options, Vue } from 'vue-class-component';
import { Emit, Prop } from 'vue-property-decorator';

@Options({
    emits: [ 'update-label' ]
})  
export default class EditableLabel extends Vue {
  @Prop() value!: string; 

  private editing = false;
  private draft: string | null = null;

  startEditMode() {
    this.editing = true;
    this.draft = this.value;
  }

  onInput(e) {
      this.draft = e.target.innerText;
  }

  cancel() {
      this.draft = this.value;
      this.editing = false;
  }

  @Emit('update-label')
  updateLabel() {
      this.editing = false;
      return this.draft;
  }
}
</script>


<!-- styles -->
<style scoped>
.container {
    background-color: white;
    /* padding: 1em 0.5em;*/
    text-align: left;
    flex-grow: 1;
    position: relative;
}
.container.editing {
    z-index: 101;
}
div.label {
    flex-grow: 1;
}
div[contenteditable="true"] {
    background: aliceblue;
    border: 3px dotted gray;
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
