// inspired by https://github.com/ueberdosis/tiptap/blob/main/packages/extension-highlight/src/highlight.ts
import {
    Mark,
    markInputRule,
    markPasteRule,
    mergeAttributes,
  } from '@tiptap/core'
  
  export interface HighlightOptions {
    HTMLAttributes: Record<string, any>,
  }
  
  declare module '@tiptap/core' {
    interface Commands<ReturnType> {
      highlight: {
        /**
         * Set a highlight mark
         */
        setHighlight: (attributes?: { color: string, backgroundColor: string }) => ReturnType,
        /**
         * Toggle a highlight mark
         */
        toggleHighlight: (attributes?: { color: string, backgroundColor: string }) => ReturnType,
        /**
         * Unset a highlight mark
         */
        unsetHighlight: () => ReturnType,
      }
    }
  }
  
  export const inputRegex = /(?:^|\s)((?:==)((?:[^~]+))(?:==))$/gm
  export const pasteRegex = /(?:^|\s)((?:==)((?:[^~]+))(?:==))/gm
  
  export const TodoMarker = Mark.create<HighlightOptions>({
    name: 'TodoMarker',
  
    defaultOptions: {
      HTMLAttributes: {},
    },
  
    addAttributes() {
      return {
        color: {
          default: null,
          parseHTML: element => {
            return {
              color: element.getAttribute('data-color') || element.style.color,
            }
          },
          renderHTML: attributes => {
            if (!attributes.color) {
              return {}
            }
  
            return {
              'data-color': attributes.color,
              style: `background-color: ${attributes.backgroundColor}; color: ${attributes.color}`,
            }
          },
        },
        backgroundColor: {
          default: null,
          parseHTML: element => {
            return {
              backgroundColor: element.getAttribute('data-background-color') || element.style.backgroundColor,
            }
          },
          renderHTML: attributes => {
            if (!attributes.backgroundColor) {
              return {}
            }
  
            return {
              'data-background-color': attributes.backgroundColor,
              style: `background-color: ${attributes.backgroundColor}; color: ${attributes.color}`,
            }
          },
        }
      }
    },
  
    parseHTML() {
      return [
        {
          tag: 'mark',
        },
      ]
    },
  
    renderHTML({ HTMLAttributes }) {
      return ['mark', mergeAttributes(this.options.HTMLAttributes, HTMLAttributes), 0]
    },
  
    addCommands() {
      return {
        setHighlight: attributes => ({ commands }) => {
          return commands.setMark('TodoMarker', attributes)
        },
        toggleHighlight: attributes => ({ commands }) => {
          return commands.toggleMark('TodoMarker', attributes)
        },
        unsetHighlight: () => ({ commands }) => {
          return commands.unsetMark('TodoMarker')
        },
      }
    },
  
    addKeyboardShortcuts() {
      return {
        'Mod-Shift-h': () => this.editor.commands.toggleHighlight(),
      }
    },
  
    addInputRules() {
      return [
        markInputRule(inputRegex, this.type),
      ]
    },
  
    addPasteRules() {
      return [
        markPasteRule(inputRegex, this.type),
      ]
    },
  })
  