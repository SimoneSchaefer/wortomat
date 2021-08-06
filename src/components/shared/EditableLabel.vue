<template>
    <div class="container w-100" v-bind:class=" { editing: editing}">
        <div class="editing p-d-flex p-jc-between" v-if="editing">
            <div class="label" contenteditable="true" @input="onInput">{{ value }}</div>
            <div class="options">
                <Button class="p-button p-button-text" icon="pi pi-check" v-on:click="updateLabel()"></Button>            
                <Button class="p-button p-button-text" icon="pi pi-times" v-on:click="cancel()"></Button>            
            </div>
        </div>
        <div v-else>
            <div class="label" v-on:click="startEditMode()" contenteditable="false">
                <span v-if="value && value.trim().length">{{ value }}</span>
                <span v-else class="dummy-text">{{ placeHolder }}</span>

            </div>
        </div>
        
    </div>
    <!-- TODO add backdrop in main vue for reuse, use state to trigger visibility -->
    <div class="backdrop" v-if="editing"></div>
</template>


<script lang="ts">
import { Options, Vue } from 'vue-class-component';
import { Emit, Prop } from 'vue-property-decorator';

@Options({
    emits: [ 'update-label' ]
})  
export default class EditableLabel extends Vue {
  @Prop() value!: string; 
  @Prop() placeHolderTitle!: string; 

  private editing = false;
  private dummyText = 'No content yet. Click to edit';
  private draft: string | null = null;

  get placeHolder() {
      return (this.placeHolderTitle || '') + ': No content yet. Click to edit';
  }

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
.dummy-text {
    color: gray;
    opacity: 0.5;
}
div.label {
    flex-grow: 1;
}

div[contenteditable="false"]:hover:after {
   content: "\f304"; 
   font-family: "Font Awesome 5 Free";
   opacity: 0.5;
   padding-left: 0.5em;
   font-weight: 900;
   position: absolute;
   right:1em; 
}

div[contenteditable="false"] {
    border: 3px solid transparent;
    padding-top: 0.5em;
    padding-left: 0.5em;
}
div[contenteditable="false"]:hover {
    cursor: url('/assets/cursors/edit.png') 1 30, pointer;    
}
div[contenteditable="true"],div[contenteditable="false"]:hover {
    background: aliceblue;
    border: 3px dotted gray;
    padding-top: 0.5em;
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
