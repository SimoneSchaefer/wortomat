<template>
  <div class="export">
    <Fieldset legend="What to include?">
      <div class="p-field-checkbox">
      <Checkbox id="include1" name="include" value="includeSummary" v-model="selectedIncludes" />
        <label for="include1">Include summary</label>
      </div>
      <div class="p-field-checkbox">
        <Checkbox id="include2" name="include" value="includeExtendedSummary" v-model="selectedIncludes" />
        <label for="include2">Include extended summary</label>
      </div>
      <div class="p-field-checkbox">
        <Checkbox id="include3" name="include" value="includeContent" v-model="selectedIncludes" />
        <label for="include3">Include content</label>
      </div>  
    </Fieldset>

    <Fieldset legend="Which format?">
      <SelectButton v-model="selectedType" :options="typeOptions" optionLabel="name" :multiple="false" />
    </Fieldset>

    <div class="export-button">
      <Button @click="exportNovel()">Export</Button>
    </div>
  
  </div>
</template>


<script lang="ts">

import { Vue } from 'vue-class-component';
import { ExportService, ExportType } from '@/service/ExportService';
export default class Export extends Vue {

  selectedIncludes = ['includeSummary', 'includeExtendedSummary', 'includeContent'];
  selectedType = this.typeOptions[0];

  exportNovel(): void {
    const exportOptions = {
      type: this.selectedType.type || ExportType.HTML,
      includeSummary: this.selectedIncludes.includes('includeSummary'),
      includeExtendedSummary: this.selectedIncludes.includes('includeExtendedSummary'),
      includeContent: this.selectedIncludes.includes('includeContent')
    }
    new ExportService().export(this.$store.state.currentNovel?.id, exportOptions).then((response) => {
      this.$toast.add({severity:'success', summary: 'Success', detail: `Your novel has been exported to ${response.data}`, life: 3000});
    }, error => {
      this.$toast.add({severity:'error', summary: 'This did not work :(', detail:error, life: 3000});
    });
  }

  get typeOptions(): Array<{ type: ExportType, name: string}> {
    return [ 
      { type: ExportType.HTML, name: 'HTML'},
      { type: ExportType.PDF, name: 'PDF'},
      { type: ExportType.DOC, name: 'DOC'}
    ]
  }

  
}
</script>

<style scoped>
fieldset, .export-button {
  margin: 3em;
}

.export-button {
  text-align: center;
}
</style>