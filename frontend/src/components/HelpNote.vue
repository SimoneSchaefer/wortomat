<template>
  <div class="help-note-container">
    <h1 class="empty-info">{{$t('empty_info')}}</h1>
  </div>
</template>

<script lang="ts">
import { NOVEL_ITEM_KEYS } from "@/store/keys";
import { Vue } from "vue-class-component";
import { Prop } from "vue-property-decorator";

export default class HelpNote extends Vue {
  @Prop() itemKey: NOVEL_ITEM_KEYS;
}
</script>

<style scoped>
iframe {
  width: 100%;
  height: 30em;
  border: none;
}
.help-note-container {
  width: 100%;
  height: 100%;
  display: flex;
  justify-content: center;
  align-content: center;
  margin: 3em;
}

.help-note {
  height: 30em;
  min-width: 40em;
  max-width: 50em;
  background-color: #fff;
  border-radius: 5px;
  padding: 1em;
}

.sheet {
  border: var(--sheet-border);
  margin: 3em;
  width: 100%;
  max-width: 300em;
  padding: 5em;
  position: relative;
  top: 1em;
  bottom: 3em;
  background: var(--sheet-background);
}

.empty-info {
  color: #fff;
}

hr {
  border-color: #c8c8c875;
}

.header-container {
  display: flex;
}

.meta {
  flex-grow: 1;
}

.header {
  font-size: 1.2rem;
  font-weight: bold;
}

p {
  padding: 1em 1em 0 1em;
}
</style>
