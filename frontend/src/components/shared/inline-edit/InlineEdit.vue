<template>
    <div class="container w-100" 
        :title="editing ? '' : 'Click to edit'" 
        v-bind:class=" { editing: editing, readonly: !editing }" 
        v-on:click="editModeActivated">
        <div class="editing p-d-flex p-jc-between" v-if="editing">
            <div class="value" v-on:keydown.esc="cancel" v-on:keydown.enter="validateAndUpdate">
                <slot name="editing"></slot>
            </div>
            <div class="options">
                <AppButton color="success" icon="fa fa-check" title="Save" v-on:click="validateAndUpdate"></AppButton>            
                <AppButton color="danger" icon="fa fa-times" title="Cancel" v-on:click="cancel"></AppButton>            
            </div>
        </div>
        <div v-else class="readonly">
            <slot name="readonly"></slot>
        </div>
    </div>
</template>

<script lang="ts">
import { Options, Vue } from "vue-class-component";
import { Emit, Prop } from "vue-property-decorator";
import AppButton from "@/components/shared/Button.vue";

@Options({
    components: { AppButton },
    emits: ['start-edit', 'update', 'cancel']
})  
export default class InlineEdit extends Vue {
    editing = false;
    @Prop() currentValue: string;
    @Prop() validationRegex: RegExp;

    validateAndUpdate($event: Event): void {
        this.stopEvent($event);
        if (!this.validationRegex) {
            this.update($event);
        }
        if (this.currentValue.match(this.validationRegex)) {
            this.update($event);
        }
    }

    editModeActivated(): void {
        if (this.editing) {
            return;
        }
        this.startEditMode();
    }

    @Emit('start-edit')
    startEditMode(): void {
        this.$store.dispatch('setModalOpen', { isOpen: true })
        this.editing = true;
    }

    @Emit('update')
    update($event: Event): void {
        this.stopEvent($event);
        this.editing = false;
    }

    @Emit('cancel')
    cancel($event: Event): void {
        this.stopEvent($event);
        this.editing = false;
        this.$store.commit('setModalOpen', {isOpen: false})
    }

    private stopEvent($event: Event) {
        $event.preventDefault();
        $event.stopPropagation();
    }
}
</script>


<style scoped>
.container {
    text-align: left;
    position: relative;
    border: 3px solid transparent;
    padding: 0.5rem;
}
.container.editing {
    z-index: var(--z-inline-edit);
    background: var(--editable-background-editing);
}

.container.readonly:hover {
    cursor: url("/assets/cursors/edit.png"), auto;
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

</style>

<style>
.container  .editing {
    border: 2px solid #1d1d1d;
}
.container .editing div[contenteditable="true"] {
    background: var(--editable-background-input);
}

.container.editing .options button {
    width: 3em !important;
}

.container.editing .options button:first-child {
    border-left: 1px solid #1d1d1d;
    border-right: 1px solid #1d1d1d;
}
</style>