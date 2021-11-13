<template>
    <Dialog v-model:visible="editing" 
    :modal="true" 
    :closeOnEscape="false" 
    :closable="false" 
    :draggable="false"
    :style="{ 'width': 'calc(100% - 5em)', 'max-width': '80em', 'text-align': 'left', 'height': 'calc(100% - 5em)'  }">
        <TipTap :content="value" ref="editorRef"/>
        <template #footer>
            <Button label="Cancel" v-on:click="cancel"></Button>
            <Button label="Save" v-on:click="updateText"></Button>
        </template>
    </Dialog>
    <div class="content" v-on:click="startEditMode()">
        <div v-if="value?.length" v-html="value"></div>
        <div v-else><MissingValueTolerantLabel :value="value" fallback="No content added yet."></MissingValueTolerantLabel></div>
    </div>
</template>


<script lang="ts">
import { Options, Vue } from 'vue-class-component';
import { Emit, Prop } from 'vue-property-decorator';
import TipTap from '../wysisyg/TipTap.vue'
import InlineEdit from '@/components/shared/inline-edit/InlineEdit.vue';
import MissingValueTolerantLabel from '@/components/shared/MissingValueTolerantLabel.vue';

@Options({
    components: { TipTap, InlineEdit, MissingValueTolerantLabel},
    emits: [ 'update-text' ]
})  
export default class EditableLabel extends Vue {
    @Prop() header!: string; 
    @Prop() value!: string; 

    editing = false;

    startEditMode(): void {
        this.editing = true;
    }

    cancel(): void {
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
        } else { this.discard(); }    
    }

    @Emit('update-text')
    updateText(): string {
    const updatedContent = this.getCurrentContent();
    this.editing = false;
    return updatedContent;
    }


    private discard(): void {
    this.editing = false;
    }

    private getCurrentContent(): string {
        return (this.$refs.editorRef as TipTap).getContent();
    }
}
</script>

<style>
.p-dialog-content {
    height: 100%;
}
</style>

<style scoped>
.content {
    text-align: left;   
    border: 3px solid transparent;
    padding: 1em;
}
div.content:hover {
    border: 3px solid transparent;
    cursor: pointer;
    cursor: url("/assets/cursors/edit.png"), pointer;
    background: var(--editable-background-hover);
}
</style>
