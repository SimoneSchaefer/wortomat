<template>
    <div class="help-note">
        <iframe style="font-family: Roboto"        
          :src="`/assets/help-notes/en/${itemKey}.html`" /> <!-- TODO consider user's language -->
    </div>     
</template>

<script lang="ts">
import { NOVEL_ITEM_KEYS } from "@/store/keys";
import { Vue } from "vue-class-component";
import { Prop } from "vue-property-decorator";

export default class HelpNote extends  Vue {
    @Prop() itemKey: NOVEL_ITEM_KEYS;
}
</script>

<style scoped>
iframe {
  width: 100%;
  height: 30em;
  border: none;
}
.help-note {
  height: 30em;
  min-width: 40em;
  max-width: 50em;
  background-color: #fff;
  border-radius: 5px;
  padding: 1em;

}

p {
  padding: 1em 1em 0 1em;
}
</style>
