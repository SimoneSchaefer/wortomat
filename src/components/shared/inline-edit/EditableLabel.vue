<template>
<InlineEdit @start-edit="onStartEdit" @update="updateLabel" @cancel="cancel">
    <template v-slot:editing>
        <div class="label" contenteditable="true" @input="onInput" ref="editableRef" >
            {{ value }}
        </div>
    </template>
    <template v-slot:readonly>
        <MissingValueTolerantLabel :value="value" :fallback="placeHolder"></MissingValueTolerantLabel>
    </template>
</InlineEdit>
</template>


<script lang="ts">
import { Options, Vue } from 'vue-class-component';
import { Emit, Prop } from 'vue-property-decorator';
import MissingValueTolerantLabel from '@/components/shared/MissingValueTolerantLabel.vue';
import InlineEdit from '@/components/shared/inline-edit/InlineEdit.vue';

@Options({
    components: { InlineEdit, MissingValueTolerantLabel },
    emits: [ 'update-label' ]
})  
export default class EditableLabel extends Vue {
  @Prop() value!: string; 
  @Prop() placeHolderTitle!: string; 

  private draft: string | null = null;

  get placeHolder() {
    return (this.placeHolderTitle || '');
  }

  onStartEdit() {
    this.draft = this.value;

    setTimeout(() => {
        (this.$refs.editableRef as any).focus();
    }, 0);
  }

  onInput(e) {
      this.draft = e.target.innerText.replace('\n', '');
  }

  cancel() {
      this.draft = this.value;
  }

  @Emit('update-label')
  updateLabel() {
      return this.draft;
  }
}
</script>