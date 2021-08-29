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

    confirm() {
        if (this.isVisible) {
            this.$confirm.require({
                message: this.message || 'Are you sure you want to proceed?',
                header: this.header || 'Confirmation',
                icon: 'pi pi-exclamation-triangle',
                accept: () => {
                    this.accept();
                }, 
                reject: () => {
                    this.cancel();
                }
            })
        }        
    }

    @Emit()
    accept() { 
        this.isVisible = false;
        return true; 
    }

    @Emit()
    cancel() {
        this.isVisible = false;
        return false;
    }

    getDecision() {
        this.isVisible = true;
        this.confirm();        
  }  
}
</script>



