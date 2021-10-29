<template>
<InlineEdit 
    :validationRegex="validationRegex" 
    :currentValue="draft"
    @start-edit="onStartEdit" 
    @update="updateLabel" 
    @cancel="cancel" >
    <template v-slot:editing>
        <div class="editable-container">
            <div class="editable"  
                @input="onInput"  
                v-bind:class=" { 'has-error': hasError }"
                contenteditable="true" 
                ref="editableRef" >
                {{ value }}
            </div>
            <div v-if="hasError" class="has-error error-label">
                {{ formatInfo }}
            </div>
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
  @Prop() formatInfo: string;

  private draft: string | null = null;

  get placeHolder(): string {
    return (this.placeHolderTitle || '');
  }

  get hasError() {
      if (!this.draft) { return false; }
      if (!this.validationRegex) { return false }
      return !this.draft.match(this.validationRegex);
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
.editable-container {
    display: flex;
    flex-direction: column;
    height: 100%;
}

.editable {
    display: flex;
    height: 100%;
    align-items: center;
    padding: 0 1em;
}

.has-error {
    color: var(--font-color-error);
}

.error-label {
    font-size: x-small;
    text-align: right;
    padding-right: 1em;
}
</style>