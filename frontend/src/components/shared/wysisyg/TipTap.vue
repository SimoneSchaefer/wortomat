<template>
    <div class="editor" v-if="editor">
        <div id="editor-toolbar">
            <div class="tools">

                <editor-option-button :menuItems="textFormatMenuItems" :toggleLabel="'editor.format_options'"></editor-option-button>
                <editor-option-button :menuItems="headerMenuItems" :toggleLabel="'editor.header_options'"></editor-option-button>
                <editor-option-button :menuItems="listMenuItems" :toggleLabel="'editor.list_options'"></editor-option-button>
                <editor-option-button :menuItems="markerMenuItems" :toggleLabel="'editor.marker_options'"></editor-option-button>
                <editor-option-button :menuItems="alignmentMenuItems" :toggleLabel="'editor.alignment_options'"></editor-option-button>
                <button class="editor-button padding-left" :title="$t('editor.clear')" @click="runCommand('unsetAllMarks') && this.runCommand('clearNodes')"><i class="fa fa-eraser"></i></button>
                <button class="editor-button"  :title="$t('editor.undo')" @click="runCommand('undo')"><i class="fa fa-undo"></i></button>
                <button class="editor-button" :title="$t('editor.redo')" @click="runCommand('redo')" ><i class="fa fa-redo"></i></button>
            </div>
            <div class="other">
                <AppButton type="button" color="success" icon="fa fa-check" title="editor.save" v-on:click="save"></AppButton>            
                <AppButton type="button" color="danger" icon="fa fa-times" title="editor.cancel" v-on:click="cancel"></AppButton>   
            </div>
        </div>
        <div class="editor-content">
            <editor-content :editor="editor" />
        </div>
    </div>
</template>

<script lang="ts">
import { Editor, EditorContent } from '@tiptap/vue-3';
import { Options, Vue } from 'vue-class-component';
import { Emit, Prop } from 'vue-property-decorator';

import StarterKit from '@tiptap/starter-kit';
import Typography from '@tiptap/extension-typography';
import Underline from '@tiptap/extension-underline';
import TextAlign from '@tiptap/extension-text-align';

import AppButton from '@/components/forms/Button.vue';
import EditorOptionButton from './EditorOptionButton.vue';
import TodoMarker from './todo-marker';
import QuotesHandler from './quotes-handler';


@Options({
  components: { EditorContent, AppButton, EditorOptionButton },
  emits: [ 'save', 'cancel']
})
export default class TipTap extends Vue { 
    @Prop() content: string;
    editor: Editor = null;

    

    markerColors = {
        "todo": { backgroundColor: '#fffc45', color: '#000'},
        "fixme": { backgroundColor: '#e31f14', color: '#fff'},
        "idea": { backgroundColor: '#5b63f0', color: '#000'},
    }


    textFormatMenuItems = [];
    headerMenuItems = [];
    listMenuItems = [];
    markerMenuItems = [];
    alignmentMenuItems = [];



    mounted(): void {
        this.editor = new Editor({
            content: this.content,
            autofocus: true,
            extensions: [
                StarterKit,
                Typography.configure({
                    openDoubleQuote: false,
                    closeDoubleQuote: false,
                    openSingleQuote: false,
                    closeSingleQuote: false
                }),
                QuotesHandler,
                Underline,
                TextAlign.configure({
                    types: ['heading', 'paragraph'],
                }),
                TodoMarker.configure(),
                
                /*TipTapLink.configure({
                    openOnClick: false,
                    linkOnPaste: false,
                })*/
            ],
        });

        this.textFormatMenuItems = [{
            label: this.$t('editor.bold'),
            icon: 'fa fa-bold',
            command: () => {
                this.runCommand('toggleBold')
            }
            },{
                label: this.$t('editor.italic'),
                icon: 'fa fa-italic',
                command: () => {
                    this.runCommand('toggleItalic')
                }
            },{
                label: this.$t('editor.strike'),
                icon: 'fa fa-strikethrough',
                command: () => {
                    this.runCommand('toggleStrike')
                }
            },{
                label: this.$t('editor.underline'),
                icon: 'fa fa-underline',
                command: () => {
                    this.runCommand('toggleUnderline')
                }
            }, {
                label: this.$t('editor.code'),
                icon: 'pi pi-code',
                command: () => {
                    this.runCommand('toggleCode')
                }
            },{
                label: this.$t('editor.quote'),
                icon: 'fa fa-quote-right',
                command: () => {
                    this.runCommand('toggleBlockquote')
                }
            },
        ];

        this.headerMenuItems = [{
                label: 'H1',
                icon: 'fa fa-heading',
                command: () => {
                    this.runCommand('toggleHeading', { level: 1})
                }
            },{
                label: 'H2',
                icon: 'fa fa-heading',
                command: () => {
                    this.runCommand('toggleHeading', { level: 2})
                }
            },{
                label: 'H3',
                icon: 'fa fa-heading',
                command: () => {
                    this.runCommand('toggleHeading', { level: 3})
                }
            },{
                label: 'H4',
                icon: 'fa fa-heading',
                command: () => {
                    this.runCommand('toggleHeading', { level: 4})
                }
            },{
                label: 'H5',
                icon: 'fa fa-heading',
                command: () => {
                    this.runCommand('toggleHeading', { level: 5})
                }
            },{
                label: 'H6',
                icon: 'fa fa-heading',
                command: () => {
                    this.runCommand('toggleHeading', { level: 6})
                }
            }
        ];

        this.listMenuItems = [{
            label: this.$t('editor.ul'),
            icon: 'fa fa-list-ul',
            command: () => {
                this.runCommand('toggleBulletList')
            }
        }, {
            label: this.$t('editor.ol'),
            icon: 'fa fa-list-ol',
            command: () => {
                this.runCommand('toggleOrderedList')
            }
        }];

        this.alignmentMenuItems = [{
            label: this.$t('editor.align_left'),
            icon: 'fa fa-list-ul',
            command: () => {
                this.runCommand('setTextAlign', 'left')
            }
        }, {
            label: this.$t('editor.align_center'),
            icon: 'fa fa-list-ol',
            command: () => {
                this.runCommand('setTextAlign', 'center')
            }
        }, {
            label: this.$t('editor.align_right'),
            icon: 'fa fa-list-ol',
            command: () => {
                this.runCommand('setTextAlign', 'right')
            }
        }, {
            label: this.$t('editor.align_justify'),
            icon: 'fa fa-list-ol',
            command: () => {
                this.runCommand('setTextAlign', 'justify')
            }
        }];

        this.markerMenuItems = [{
            label: this.$t('editor.align_right'),
            icon: 'fa fa-lightbulb',
            command: () => {
                this.runCommand('toggleHighlight', this.markerColors['idea'])
            }
        },{
            label: this.$t('editor.highlight_todo'),
            icon: 'fa fa-clipboard-list',
            command: () => {
                this.runCommand('toggleHighlight', this.markerColors['todo'])
            }
        },{
            label: this.$t('editor.highlight_fixme'),
            icon: 'fa fa-toolbox',
            command: () => {
                this.runCommand('toggleHighlight', this.markerColors['fixme'])
            }
        }]
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
        this.editor.chain().focus()[command](args).run();
        return true;
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
    height:4em;
    display: flex;
    justify-content: space-between;
    align-items: center;
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

#editor-toolbar .other {
    margin-right: 2em;
}
.other {
    border: 2px solid #1d1d1d;
}

.other button {
    width: 3em !important;
    border-left: 1px solid #1d1d1d !important;
    border-right: 1px solid #1d1d1d !important;
}

#editor-toolbar .p-menubar {
    background: none;
}

#editor-toolbar button.editor-button {
    outline: none;
    color: #cececee0;
    background: var(--dark-background);
    height: 4em;
    min-width:4em;
    border:none;

}


#editor-toolbar button.editor-button.is-active {
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

.padding-left {
    margin-left: 3em;
}


#editor-toolbar .button.editor-button {
    background: none;
    border: none;
    cursor: pointer;
    display: inline-block;
    padding: 3px 5px;
    width: 28px;
    color: #777676;
}

#editor-toolbar button.editor-button:hover {
    cursor: pointer;
    color: #cecece;
    background-color: #5f5f5f;
}

#editor-toolbar button.editor-button.is-active {
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