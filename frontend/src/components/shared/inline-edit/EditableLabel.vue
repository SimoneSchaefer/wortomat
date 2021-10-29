<template>
<InlineEdit @start-edit="onStartEdit" @update="updateLabel" @cancel="cancel" :validationRegex="validationRegex" :currentValue="draft">
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
  @Prop() validationRegex: RegExp;

  private draft: string | null = null;

  get placeHolder(): string {
    return (this.placeHolderTitle || '');
  }

  onStartEdit(): void {
    this.draft = this.value;

    setTimeout(() => {
        (this.$refs.editableRef as HTMLInputElement).focus();
    }, 0);
  }

  onInput(e: InputEvent): void {
      this.draft = e.target['innerText'].replace('\n', '');
  }

  cancel(): void {
      this.draft = this.value;
  }

  @Emit('update-label')
  updateLabel(): string {
    return this.draft;
  }
}
</script>

<style scoped>
.label {
    display: flex;
    height: 100%;
    align-items: center;
    padding: 0 1em;
}
</style>