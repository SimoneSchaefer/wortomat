<template>
    <div class="editor" v-if="editor">
        <div id="editor-toolbar">
            <div class="tools">
                <button @click="runCommand('toggleBold')" :class="{ 'is-active': editor.isActive('bold') }"><i class="fa fa-bold"></i></button>
                <button @click="runCommand('toggleItalic')" :class="{ 'is-active': editor.isActive('italic') }"><i class="fa fa-italic"></i></button>
                <button @click="runCommand('toggleStrike')" :class="{ 'is-active': editor.isActive('strike') }"><i class="fa fa-strikethrough"></i></button>
                <button @click="runCommand('toggleCode')" :class="{ 'is-active': editor.isActive('code') }"><i class="fa fa-code"></i></button>
                <button @click="runCommand('toggleHeading', { level: 1})" :class="{ 'is-active': editor.isActive('heading', { level: 1 }) }"><i class="fa fa-heading"></i></button>
                <button @click="runCommand('toggleBulletList')" :class="{ 'is-active': editor.isActive('bulletList') }"><i class="fa fa-list-ul"></i></button>
                <button @click="runCommand('toggleOrderedList')" :class="{ 'is-active': editor.isActive('orderedList') }"><i class="fa fa-list-ol"></i></button>
                <button @click="runCommand('toggleBlockquote')" :class="{ 'is-active': editor.isActive('blockquote') }"><i class="fa fa-quote-right"></i></button>
                <button @click="runCommand('toggleHighlight', markerColors['idea'])" :class="{ 'is-active': editor.isActive('TodoMarker', markerColors['idea'])}"><i class="fa fa-lightbulb"></i></button>
                <button @click="runCommand('toggleHighlight', markerColors['fixme'])" :class="{ 'is-active': editor.isActive('TodoMarker', markerColors['fixme'])}"><i class="fa fa-band-aid"></i></button>
                <button @click="runCommand('toggleHighlight', markerColors['todo'])" :class="{ 'is-active': editor.isActive('TodoMarker', markerColors['todo'])}"><i class="fa fa-clipboard-list"></i></button>
            </div>
            <div class="other">
                <button @click="runCommand('unsetAllMarks') && this.runCommand('clearNodes')"><i class="fa fa-eraser"></i></button>
                <button @click="runCommand('undo')"><i class="fa fa-undo"></i></button>
                <button @click="runCommand('redo')" ><i class="fa fa-redo"></i></button>
                <button @click="cancel"><i class="fa fa-times"></i></button>
                <button @click="save" class="last"><i class="fa fa-save"></i></button>
            </div>
        </div>
        <div class="editor-content">
            <editor-content :editor="editor" />
        </div>
    </div>
</template>

<script lang="ts">
import { Options, Vue } from 'vue-class-component';
import { Emit, Prop } from 'vue-property-decorator';
import { Editor, EditorContent } from '@tiptap/vue-3'
import StarterKit from '@tiptap/starter-kit'

import TodoMarker from './todo-marker'


@Options({
  components: { EditorContent },
  emits: [ 'save', 'cancel']
})
export default class TipTap extends Vue { 
    @Prop() content: string;
    editor: Editor = null;

    menuItems = [];

    markerColors = {
        "todo": { backgroundColor: 'yellow', color: 'black'},
        "fixme": { backgroundColor: 'red', color: 'white'},
        "idea": { backgroundColor: 'blue', color: 'white'},
    }


    mounted(): void {
        this.editor = new Editor({
            content: this.content,
            autofocus: true,
            extensions: [
                StarterKit,
                TodoMarker.configure()
            ],
        });
    }  
    
    @Emit('save') 
    save() {
        return this.editor.getHTML();
    }

        
    @Emit('cancel') 
    cancel() {
        return true;
    }

    runCommand(command: string, args?) {
        this.editor.chain().focus()[command](args).run()
    }

    getContent(): string {
        return this.editor.getHTML();
    } 

    beforeUnmount(): void {
        this.editor.destroy()
    }
}
</script>

<style>
.editor {
    height: 100%;
    display: flex;
    flex-direction: column;
}
#editor-toolbar {
    border: 1px solid #495057e0;
    height:40px;
    display: flex;
    justify-content: space-between;
    position: fixed;

    align-self: flex-start;
    z-index: 999;
    width: 100%;
    top: 0;
    background: var(--dark-background);
}

#editor-toolbar .tools, 
#editor-toolbar .other {
    display: flex;
}

#editor-toolbar .other button:first-child {
    border-left: 1px solid #495057e0;
}


#editor-toolbar .p-menubar {
    background: none;
}

#editor-toolbar button {
    border: 0;
    outline: none;
    color: #cececee0;
    background: var(--dark-background);
    width: 4em;
}

#editor-toolbar button:not(.last) {
    border-right: 1px solid #cececee0;
}

#editor-toolbar button.is-active {
    color: #6ba6e0;
}

#editor-toolbar .button-group {
    border-right: 1px solid #dee2e6;
    margin: 5px;
    height: 24px;
}
#editor-toolbar .button-group.last {
    border-right: none;
}


#editor-toolbar .button {
    background: none;
    border: none;
    cursor: pointer;
    display: inline-block;
    padding: 3px 5px;
    width: 28px;
    color: #495057e0;
}

#editor-toolbar .button.is-active {
    color: #5daaf6;
} 

.editor-content {
    flex-grow: 1;
    background: var(--editor-content-background);
    border-top: none;
    position: relative;
    top: 3.5em;

}

.editor-content > div {
    padding: 0.5em;
    height: 100%;
}

.editor-content > div > div {
    height: 100%;
    border: 1px solid gray;
}
.editor-content .ProseMirror {
    height: 100%;
}
.editor-content .ProseMirror-focused {
    outline:none;
}

</style>