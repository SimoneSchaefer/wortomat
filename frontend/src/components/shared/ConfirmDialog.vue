<template>
    <div></div>
</template>

<script lang="ts">
import { Options, Vue } from 'vue-class-component';
import { Emit, Prop } from 'vue-property-decorator';
@Options({
  emits: [ 'accept', 'cancel']
})
export default class ConfirmDialog extends Vue {
    @Prop() message;
    @Prop() header;
    private isVisible = false;

    confirm(additionalData): void {
        if (this.isVisible) {
            this.$confirm.require({
                message: this.$t(this.getMessage(additionalData)),
                header: this.header || this.$t('please_confirm'),
                icon: 'pi pi-exclamation-triangle',
                accept: () => {
                    this.accept(additionalData);
                }, 
                reject: () => {
                    this.cancel(additionalData);
                }
            })
        }        
    }

    @Emit()
    accept(additionalData): boolean { 
        this.isVisible = false;
        return additionalData; 
    }

    @Emit()
    cancel(additionalData): boolean {
        this.isVisible = false;
        return additionalData;
    }

    getDecision(additionalData = {}): void {
        this.isVisible = true;
        this.confirm(additionalData);        
    }  

    private getMessage(additionalData) {
        return this.message ? this.message : (additionalData.message || 'confirm_proceed');
    }
}
</script>



