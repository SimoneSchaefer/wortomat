<template>
   
   <Button class="editor-button" type="button" :label="$t(toggleLabel)" @click="toggle" aria-haspopup="true" aria-controls="overlay_menu" />
    <Menu ref="menu" id="overlay_menu" :model="menuItems" :popup="true" />


</template>

<script lang="ts">
import { Options, Vue } from 'vue-class-component';
import { EditorContent } from '@tiptap/vue-3'

import AppButton from '@/components/forms/Button.vue'
import { ref } from 'vue';
import Menu from 'primevue/menu';
import { Prop } from 'vue-property-decorator';


@Options({
  components: { EditorContent, AppButton },
  emits: [ 'save', 'cancel']
})
export default class EditorOptionButton extends Vue { 
  menu = ref<Menu>(null);

  @Prop()
  toggleLabel

  @Prop()
  menuItems /* = ref([
    {
        label: 'Options',
        items: [
            {
                label: 'Update',
                icon: 'pi pi-refresh',
                command: () => {
                  console.log('AAA')
                }
            },
            {
                label: 'Delete',
                icon: 'pi pi-times',
                command: () => {
                  console.log('AAA')

                }
            }
        ]
    },
    {
        label: 'Navigate',
        items: [
            {
                label: 'Vue Website',
                icon: 'pi pi-external-link',
                url: 'https://vuejs.org/'
            },
            {
                label: 'Router',
                icon: 'pi pi-upload',
                to: '/fileupload'
            }
        ]
    }
])*/;

  mounted(): void {
      //this.menu = ref(null);
  }

  toggle(event) {
    (this.menu as any).toggle(event);
  }
}




</script>


<style scoped>
.editor-button {
  outline: none;
  color: #cececee0;
  background: var(--dark-background);
  height: 4em;
  min-width: 4em;
  border:none;
  font-weight: 600;
}

.editor-button:after {
  content: "\f0d7"; 
  font-family: "Font Awesome 5 Free";
  font-weight: 900;
  padding-left: 5px;
}
</style>