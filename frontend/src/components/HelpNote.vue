<template>
    <Card class="help-note">
        <template #title>
          <p>{{ $t(`intro.${itemKey}.title`)}}</p>
          <hr />
        </template>
        <template #content>
          <p>{{ $t(`intro.${itemKey}.introduction_1`)}}</p>
          <p>{{ $t(`intro.${itemKey}.content_1`)}}</p>
          <p>{{ $t(`intro.${itemKey}.content_2`)}}</p>
          <p>{{ $t(`intro.${itemKey}.content_3`)}}</p>
        </template>
      </Card>     
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
p {
  padding: 1em 1em 0 1em;
}
</style>
