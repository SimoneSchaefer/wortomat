<template>
    <Backdrop :modalOpen="editing"></Backdrop>
    <div class="inline-edit" 
        :title="editing ? '' : 'Click to edit'" 
        :class=" { editing: editing, readonly: !editing }" 
        @click="editModeActivated">
        <div v-if="editing" class="p-d-flex p-jc-between editing">
            <div class="value" v-on:keydown.esc="cancel" v-on:keydown.enter="validateAndUpdate">
                <slot name="editing"></slot>
            </div>
            <div class="options">
                <AppButton color="success" icon="fa fa-check" title="save" v-on:click="validateAndUpdate"></AppButton>            
                <AppButton color="danger" icon="fa fa-times" title="cancel" v-on:click="cancel"></AppButton>            
            </div>
        </div>
        <div v-else class="readonly">
            <slot name="readonly"></slot>
        </div>
    </div>
</template>

<script lang="ts">
import AppButton from "@/components/forms/Button.vue";
import Backdrop from '@/components/shared/Backdrop.vue';
import { Options, Vue } from "vue-class-component";
import { Emit, Prop } from "vue-property-decorator";

@Options({
    components: { AppButton, Backdrop },
    emits: ['start-edit', 'update', 'cancel']
})  
export default class InlineEdit extends Vue {
    editing = false;
    @Prop() currentValue: string;
    @Prop() validationRegex: RegExp;

    @Emit('start-edit')
    startEditMode(): void {
        this.toggleEditMode(true);
    }

    @Emit('update')
    update($event: Event): void {
        this.stopEvent($event);
        this.toggleEditMode(false);
    }

    @Emit('cancel')
    cancel($event: Event): void {
        this.stopEvent($event);
        this.toggleEditMode(false);
    }

    validateAndUpdate($event: Event): void {
        this.stopEvent($event);
        if (!this.validationRegex) {
            return this.update($event);
        }
        if (this.currentValue.match(this.validationRegex)) {
            return this.update($event);
        }
    }

    editModeActivated($event): void {
        this.stopEvent($event);
        if (this.editing) {
            return;
        }
        this.startEditMode();
    }

    private toggleEditMode(active: boolean): void {
        this.editing = active;
    }

    private stopEvent($event: Event): void {
        $event.preventDefault();
        $event.stopPropagation();
    }
}
</script>


<style>
.readonly  .underline {
    border-bottom: 2px dotted rgba(99, 99, 99, 0.445);
}
</style>

<style scoped>


.inline-edit {
    /*text-align: left;*/
    position: relative;
    border: 3px solid transparent;
    padding: 0.5rem;
}

.inline-edit.editing {
    z-index: var(--z-inline-edit);
    background: var(--editable-background-editing);
    padding: 0;
}

.inline-edit.readonly:hover {
    /*cursor: url("/assets/cursors/edit.png"), pointer;*/ /*FIXME*/
    background: var(--editable-background-hover);
}

.options {
    width: 5em;
    flex-shrink: 0;
    display: flex;
    justify-content: flex-end;
}
.value {
    flex-grow: 1;
}
.inline-edit  .editing {
    border: 2px solid #1d1d1d;
}
.inline-edit .editing div[contenteditable="true"] {
    background: var(--editable-background-input);
}

.inline-edit.editing .options button {
    width: 3em !important;
}

.inline-edit.editing .options button:first-child {
    border-left: 1px solid #1d1d1d;
    border-right: 1px solid #1d1d1d;
}
</style>