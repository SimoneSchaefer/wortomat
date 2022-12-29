<template>
    <Dialog v-model:visible="editing" 
    contentClass="text-editor"
    :showHeader="false"
    :modal="true" 
    :closeOnEscape="false" 
    :closable="false" 
    :draggable="false"
    :style="{ 'width': 'calc(100% - 5em)', 'max-width': '80em', 'text-align': 'left', 'height': 'calc(100% - 5em)'  }">
        <TipTap :content="value" ref="editorRef" @save="updateText" @cancel="cancel"/>
    </Dialog>
    <div class="content" v-on:click="startEditMode()">
        <div v-if="value?.length" v-html="value"></div>
        <div v-else class="readonly underline"><MissingValueTolerantLabel :value="value" fallback="No content added yet."></MissingValueTolerantLabel></div>
    </div>
</template>


<script lang="ts">
import { Options, Vue } from 'vue-class-component';
import { Emit, Prop } from 'vue-property-decorator';
import InlineEdit from '@/components/forms/inline-edit/InlineEdit.vue';
import MissingValueTolerantLabel from '@/components/shared/MissingValueTolerantLabel.vue';
import TipTap from '@/components/shared/wysisyg/TipTap.vue';

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
    updateText(content: string): string {
        this.editing = false;
        return content;
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

.p-dialog .p-dialog-content.text-editor {
    background: var(--editor-content-background);
    margin: 0;
    padding-right: 0;
    padding-left: 0;
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
    /*cursor: url("/assets/cursors/edit.png"), pointer;*/ /* FIXME*/
    background: var(--editable-background-hover);
}
.readonly.underline {
    border-bottom: 2px dotted rgba(99, 99, 99, 0.445);
}
</style>
