// inspired by https://github.com/ueberdosis/tiptap/blob/main/packages/extension-highlight/src/highlight.ts
import {
   Extension, textInputRule
  } from '@tiptap/core'
  
  export interface HighlightOptions {
    HTMLAttributes: Record<string, string>,
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

  export interface QuoteHandlerOptions {
    openDoubleQuote?: boolean,
    closeDoubleQuote?: boolean,
    openSingleQuote?: boolean,
    closeSingleQuote?: boolean
  }

  export const QuotesHandler = Extension.create<QuoteHandlerOptions>({
  name: 'quotehandler',

  addInputRules() {
    
    const rules = [];

    const openDoubleQuote = textInputRule({
      find: /(?:^|[\s{[(<'"\u2018\u201C])(")$/,
      replace: '„',
    })
    
    const closeDoubleQuote = textInputRule({
      find: /"$/,
      replace: '“',
    })
    
    const openSingleQuote = textInputRule({
      find: /(?:^|[\s{[(<'"\u2018\u201C])(')$/,
      replace: '‚',
    })
    
    const closeSingleQuote = textInputRule({
      find: /'$/,
      replace: '‘',
    })

    rules.push(openDoubleQuote);
    rules.push(closeDoubleQuote);
    rules.push(openSingleQuote);
    rules.push(closeSingleQuote);

    return rules;
  } 
})
  
  