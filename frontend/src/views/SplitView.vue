<template>
  <Splitter style="height: 100%" :stateKey="stateKey">
    <SplitterPanel>
      <ScrollPanel>        
        <slot name="leftpanel"></slot>
      </ScrollPanel>
    </SplitterPanel>
    <SplitterPanel class="bg-gray">
      <ScrollPanel style="height: 100%">
        <slot name="content"></slot>
      </ScrollPanel>
    </SplitterPanel>
  </Splitter>
</template>

<script lang="ts">
import ScrollPanel from 'primevue/scrollpanel';
import Splitter from 'primevue/splitter';
import SplitterPanel from 'primevue/splitterpanel';
import { Options, Vue } from 'vue-class-component';
import { Prop } from 'vue-property-decorator';

@Options({
  components: { 
    Splitter, 
    SplitterPanel, 
    ScrollPanel
  }
})
export default class SplitView extends Vue {
  @Prop() stateKey: string;
}
</script>
