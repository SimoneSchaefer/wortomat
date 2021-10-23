<template>
<InlineEdit @start-edit="onStartEdit" @update="updateLabel" @cancel="cancel">
    <template v-slot:editing>
        <div class="label" contenteditable="true" @input="onInput" ref="editableRef" >
            {{ formattedDate }}
        </div>
    </template>
    <template v-slot:readonly>
        <MissingValueTolerantLabel :value="formattedDate" :fallback="placeHolder"></MissingValueTolerantLabel>
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
export default class EditableDate extends Vue {
  @Prop() value; 
  @Prop() placeHolderTitle!: string; 

  private draft: string | null = null;

  get placeHolder(): string {
    return (this.placeHolderTitle || '');
  }

  get formattedDate(): string {
      if (!this.value) {
          return null;          
      }
      return this.value.split('T')[0];
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
    const dateRegex = /[0-9]{4}-[0-9]{2}-[0-9]{2}/;
    if (!this.draft.match(dateRegex)) {
        this.$toast.add({severity:'error', summary: 'Wrong format', detail:'Format YYYY-MM-DD', life: 3000});
    }
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