<template>
    <EditableLabel 
        :value="formattedDate" 
        :placeHolderTitle="placeHolder" 
        :validationRegex="validationRegex" 
        @updateLabel="updateLabel"/>
</template>


<script lang="ts">
import { Options, Vue } from 'vue-class-component';
import { Emit, Prop } from 'vue-property-decorator';
import MissingValueTolerantLabel from '@/components/shared/MissingValueTolerantLabel.vue';
import InlineEdit from '@/components/shared/inline-edit/InlineEdit.vue';
import EditableLabel from '@/components/shared/inline-edit/EditableLabel.vue';

@Options({
    components: { InlineEdit, MissingValueTolerantLabel, EditableLabel },
    emits: [ 'update-label' ]
})  
export default class EditableDate extends Vue {
    @Prop() value: string;

    @Prop() placeHolderTitle!: string; 

    @Emit('update-label')
    updateLabel($event): string {
        return $event;
    }

    get placeHolder(): string {
        return (this.placeHolderTitle || '');
    }

    get validationRegex(): RegExp {
        return /^\d{4}-(0[1-9]|1[0-2])-(0[1-9]|[12][0-9]|3[01])$/;
    }

    get formattedDate(): string {
        return this.value ? this.value.split('T')[0] : null;        
    }
}
</script>