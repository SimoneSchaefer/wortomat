<template>
    <div class="editor" v-if="editor">
        <div id="editor-toolbar">
            <Menubar :model="menuItems" />         
        </div>
        <div class="editor-content">
            <editor-content :editor="editor" />
        </div>
    </div>
</template>

<script lang="ts">
import { Options, Vue } from 'vue-class-component';
import { Editor, EditorContent } from '@tiptap/vue-3'
import StarterKit from '@tiptap/starter-kit'
import TodoMarker from './todo-marker'
import { Prop } from 'vue-property-decorator';
import Menubar from 'primevue/menubar';


@Options({
  components: { EditorContent, Menubar }
})
export default class TipTap extends Vue { 
    @Prop() content: string;
    editor: Editor = null;

    menuItems = [];


    mounted(): void {
        this.editor = new Editor({
            content: this.content,
            autofocus: true,
            extensions: [
                StarterKit,
                TodoMarker.configure()
            ],
        });

        this.menuItems = [{
                icon: 'fa fa-heading',
                command: () => this.runCommand('toggleHeading', { level: 1})
            }, {
                icon: 'fa fa-bold',
                command: () => this.runCommand('toggleBold')
            }, {
                icon: 'fa fa-italic',
                command: () => this.runCommand('toggleItalic')
            }, {
                icon: 'fa fa-strikethrough',
                command: () => this.runCommand('toggleStrike')
            }, {
                icon: 'fa fa-code',
                command: () => this.runCommand('toggleCode')
            }, {
                icon: 'fa fa-quote-right',
                command: () => this.runCommand('toggleBlockquote')
            }, {
                separator: true
            },{
                icon: 'fa fa-list-ol',
                command: () => this.runCommand('toggleOrderedList')
            }, {
                icon: 'fa fa-list-ul',
                command: () => this.runCommand('toggleBulletList')
            }, {
                separator: true
            }, {
                icon: 'fa fa-clipboard-list',
                command: () => this.runCommand('toggleHighlight', { backgroundColor: 'yellow', color: '#000'})
            }, {
                icon: 'fa fa-lightbulb',
                command: () => this.runCommand('toggleHighlight', { backgroundColor: 'blue', color: '#fff'})
            }, {
                icon: 'fa fa-band-aid',
                command: () => this.runCommand('toggleHighlight', { backgroundColor: '#D32F2F', color: '#fff'})
            }, {
                separator: true
            }, {
                icon: 'fa fa-undo',
                command: () => { this.runCommand('undo')}
            }, {
                icon: 'fa fa-redo',
                command: () => { this.runCommand('redo')}
            }, {
                icon: 'fa fa-eraser',
                command: () => { this.runCommand('unsetAllMarks'), this.runCommand('clearNodes')
            }
        }]
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
    border: 1px solid #d2d2d2;
    height: 100%;
    display: flex;
    flex-direction: column;
}
#editor-toolbar {
    border-bottom: 1px solid #dee2e6;
    height:40px;
    display: flex;
    position: sticky;
    align-self: flex-start;
    z-index: 999;
    width: 100%;
    top: 0;
    background: var(--editor-toolbar-background);
}

#editor-toolbar .p-menubar {
    background: none;
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
    color: #495057;
}

#editor-toolbar .button.is-active {
    color: #5daaf6;
} 

.editor-content {
    flex-grow: 1;
    background: var(--editor-content-background);
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