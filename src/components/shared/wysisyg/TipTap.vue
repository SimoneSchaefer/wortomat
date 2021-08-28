<template>
    <div class="editor" v-if="editor">
        <div id="editor-toolbar">
            <div class="button-group">
                <button class="button" @click="editor.chain().focus().toggleBold().run()" :class="{ 'is-active': editor.isActive('bold') }"><i class="fa fa-bold"></i></button>
                <button class="button" @click="editor.chain().focus().toggleItalic().run()" :class="{ 'is-active': editor.isActive('italic') }"><i class="fa fa-italic"></i></button>
                <button class="button" @click="editor.chain().focus().toggleStrike().run()" :class="{ 'is-active': editor.isActive('strike') }"><i class="fa fa-strikethrough"></i></button>
            </div>
            <div class="button-group">
                <button class="button" @click="editor.chain().focus().toggleBulletList().run()"><i class="fa fa-list-ul"></i></button>
                <button class="button" @click="editor.chain().focus().toggleOrderedList().run()"><i class="fa fa-list-ol"></i></button>
            </div>
            <div class="button-group">
                <button class="button" @click="editor.chain().focus().toggleBlockquote().run()"><i class="fa fa-quote-right"></i></button>
            </div>
            <div class="button-group">
                <button class="button" @click="editor.chain().focus().toggleHighlight({backgroundColor: '#D32F2F', color: '#fff'}).run()" :class="{ 'is-active': editor.isActive('highlight', { backgroundColor: '#D32F2F', color: '#fff' }) }"><i class="fa fa-flag"></i></button>
                <!--
                    <button class="button" @click="editor.chain().focus().toggleHighlight({color: 'yellow' }).run()" :class="{ 'is-active': editor.isActive('highlight', { color: 'yellow' }) }"><i class="fa fa-wrench"></i></button>
                    <button class="button" @click="editor.chain().focus().toggleHighlight({color: 'green' }).run()" :class="{ 'is-active': editor.isActive('highlight', { color: 'green' }) }"><i class="fa fa-lightbulb"></i></button>
                -->
            </div>
            <div class="button-group last">
                <button class="button" @click="editor.chain().focus().undo().run()"><i class="fa fa-undo"></i></button>
                <button class="button" @click="editor.chain().focus().redo().run()"><i class="fa fa-redo"></i></button>
                <button class="button" @click="editor.chain().focus().unsetAllMarks().run()"><i class="fa fa-eraser"></i></button>
            </div>
        </div>
        <div class="editor-content">
            <editor-content :editor="editor" />
        </div>
    </div>
</template>

<script>
import { Editor, EditorContent } from '@tiptap/vue-3'
import StarterKit from '@tiptap/starter-kit'
import TodoMarker from './todo-marker'

export default {
  components: {
    EditorContent,
  },

  props: {
     content: String 
  },

  getContent() {
      return this.editor.getHtml();
  },

  data() {
    return {
      editor: null,
    }
  },

  mounted() {
    this.editor = new Editor({
      content: this.content,
      autofocus: true,
      extensions: [
        StarterKit,
        TodoMarker.configure(),
      ],
    });
  },

  beforeUnmount() {
    this.editor.destroy()
  },
}
</script>

<style>
.editor {
    border: 1px solid #d2d2d2;
    height: 100%;
}
#editor-toolbar {
    background: #f8f9fa;
    border-top-right-radius: 3px;
    border-top-left-radius: 3px;
    border: 1px solid #dee2e6;
    height:40px;
    display: flex;
    position: fixed;
    z-index: 999;
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
    position: relative;
    top: 40px;
    height: 100%;
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