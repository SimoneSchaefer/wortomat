<!-- template -->
<template>
    <div class="label" v-on:dblclick="startEditMode()" :contenteditable="editing">
        {{ value }}
    </div>
    <div class="backdrop" :v-if="editing">
    </div>
    
</template>


<!-- code -->
<script lang="ts">
import { Options, Vue } from 'vue-class-component';
import { Emit, Prop } from 'vue-property-decorator';

@Options({})  
export default class EditableLabel extends Vue {
  @Prop() value!: string; 

  private editing = false;

  startEditMode() {
      console.log('EDITING')
      this.editing = true;
  }






  @Emit('update-label')
  updateLabel() {
      return this.value;
  }
}
</script>

<style scoped>
div.label {
    padding: 1em;
}
div.label[contenteditable="true"] {
    background: aliceblue;
}
div.backdrop {
    background-color: black;
    position: fxied; 
    top: 0;
    left: 0;
    height: 100%;
    width: 100%;
}

</style>
