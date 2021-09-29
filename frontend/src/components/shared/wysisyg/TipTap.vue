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

        this.menuItems = [
            this.headingMenu,
            this.formatMenu,
            this.listMenu,
            this.markersMenu,
            this.undoMenu,
            this.redoMenu,
            this.clearMenu
        ]
    }

    get undoMenu() {
        return {
            label: 'undo',
            icon: 'fa fa-undo',
            command: () => { this.runCommand('undo')}
        }
    }

    get redoMenu() {
        return {
            label: 'redo',
            icon: 'fa fa-redo',
            command: () => { this.runCommand('redo')}
        }
    }

    get clearMenu() {
        return {
            label: 'Clear format',
            icon: 'fa fa-eraser',
            command: () => { this.runCommand('unsetAllMarks'), this.runCommand('clearNodes')}
        }
    }


    get markersMenu() {
        return {
            label: 'Markers',
            icon: 'fa fa-flag',
            items: [{
                label: 'TODO',
                icon: 'fa fa-clipboard-list',
                command: () => this.runCommand('toggleHighlight', { backgroundColor: 'yellow', color: '#000'})
            }, {
                label: 'Idea',
                icon: 'fa fa-lightbulb',
                command: () => this.runCommand('toggleHighlight', { backgroundColor: 'blue', color: '#fff'})
            }, {
                label: 'Fix me',
                icon: 'fa fa-band-aid',
                command: () => this.runCommand('toggleHighlight', { backgroundColor: '#D32F2F', color: '#fff'})
            }]
        }
    }

    get headingMenu() {
        return {
            label: 'Headings',
            icon: 'fa fa-heading',
            items: [{
                label: '1',
                icon: 'fa fa-heading',
                command: () => this.runCommand('toggleHeading', { level: 1})
            }, {
                label: '2',
                icon: 'fa fa-heading',
                command: () => this.runCommand('toggleHeading', { level: 2 })
            }, {
                label: '3',
                icon: 'fa fa-heading',
                command: () => this.runCommand('toggleHeading', { level: 3 })
            }, {
                label: '4',
                icon: 'fa fa-heading',
                command: () => this.runCommand('toggleHeading', { level: 4 })
            }, {
                label: '5',
                icon: 'fa fa-heading',
                command: () => this.runCommand('toggleHeading', { level: 5 })
            }, {
                label: '6',
                icon: 'fa fa-heading',
                command: () => this.runCommand('toggleHeading', { level: 6 })
            }]
        }
    }



    get formatMenu() {
        return {
                label: 'Format',
                icon: 'fa fa-paragraph',
                items: [{
                    label: 'bold',
                    icon: 'fa fa-bold',
                    command: () => this.runCommand('toggleBold')
                }, {
                    label: 'italic',
                    icon: 'fa fa-italic',
                    command: () => this.runCommand('toggleItalic')
                }, {
                    label: 'strike',
                    icon: 'fa fa-strikethrough',
                    command: () => this.runCommand('toggleStrike')
                }, {
                    label: 'code',
                    icon: 'fa fa-code',
                    command: () => this.runCommand('toggleCode')
                }, {
                    label: 'quote',
                    icon: 'fa fa-quote-right',
                    command: () => this.runCommand('toggleBlockquote')
                }]
        }
    }

    get listMenu() {
        return {
                label: 'Lists',
                icon: 'fa fa-list',
                items: [{
                    label: 'ordered',
                    icon: 'fa fa-list-ol',
                    command: () => this.runCommand('toggleOrderedList')
                }, {
                    label: 'unordered',
                    icon: 'fa fa-list-ul',
                    command: () => this.runCommand('toggleBulletList')
                }]
        }
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