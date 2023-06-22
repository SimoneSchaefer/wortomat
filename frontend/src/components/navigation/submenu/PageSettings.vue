<template>
    <div class="page-settings">
        <div class="page-setting">
            <span class="p-float-label">
                <InputNumber id="pageHeight" type="number" v-model="pageSettings.pageHeight"/>
                <label for="pageHeight">Page Height</label>
            </span>
        </div>
        <div class="page-setting">
            <span class="p-float-label">
                <InputNumber id="pageWidth" type="number" v-model="pageSettings.pageWidth" />
                <label for="pageHeight">Page Width</label>
            </span>
        </div>
        <div class="page-setting">
            <span class="p-float-label">
                <InputNumber id="marginInner" type="number" v-model="pageSettings.marginInner" />
                <label for="marginInner">Inner margin</label>
            </span>
        </div>
        <div class="page-setting">
            <span class="p-float-label">
                <InputNumber id="marginOuter" type="number" v-model="pageSettings.marginOuter"/>
                <label for="marginOuter">Outer margin</label>
            </span>
        </div>
        <div class="page-setting">
            <span class="p-float-label">
                <InputNumber id="marginOuter" type="number" v-model="pageSettings.fontSize"/>
                <label for="fontSize">Outer margin</label>
            </span>
        </div>
    </div>

</template>

<script lang="ts">
import { Options, Vue } from 'vue-class-component';
import { EXPORT_FORMAT } from '@/store/ExportSettingsModule';

import { namespace } from 's-vuex-class';
import { Prop } from 'vue-property-decorator';
import { PageSettingsModel } from '@/models/PageSettings.model';

const exportModule = namespace('export');

@Options({
    components: {}
})
export default class PageSettings extends Vue {
    @Prop()
    selectedType: EXPORT_FORMAT;

    pageSettings: PageSettingsModel = {
        pageHeight: 12,
        pageWidth: 8,
        marginInner: 1,
        marginOuter: 1,
        fontSize: 9
    }; // TODO: store these settings

}
</script>

<style scoped>
.page-settings {
    display: flex;
    flex-wrap: wrap;
    gap: 5px;
}

.page-setting {
    flex: 1 0 40%; 
    margin-bottom: 1.8rem;  
}
</style>