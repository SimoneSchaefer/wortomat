<template>
    <div class="container w-100" v-bind:class=" { editing: editing, readonly: !editing}" title="Click to edit">
        <div class="editing p-d-flex p-jc-between" v-if="editing">
            <div class="value" v-on:keydown.esc="cancel" v-on:keydown.enter="update">
                <slot name="editing"></slot>
            </div>
            <div class="options">
                <Button class="p-button p-button-text" icon="pi pi-check" v-on:click="update"></Button>            
                <Button class="p-button p-button-text" icon="pi pi-times" v-on:click="cancel"></Button>            
            </div>
        </div>
        <div v-else v-on:click="startEditMode()" >
            <slot name="readonly"></slot>
        </div>
    </div>
     <!-- TODO add backdrop in main vue for reuse, use state to trigger visibility -->
    <div class="backdrop" v-if="editing"></div>

</template>

<script lang="ts">
import { Options, Vue } from "vue-class-component";
import { Emit } from "vue-property-decorator";

@Options({
    emits: ['start-edit', 'update', 'cancel']
})  
export default class InlineEdit extends Vue {
    editing = false;

    @Emit('start-edit')
    startEditMode(): void {
        this.editing = true;
    }

    @Emit('update')
    update($event: Event): void {
        $event.preventDefault();
        $event.stopPropagation();
        this.editing = false;
    }

    @Emit('cancel')
    cancel($event: Event): void {
        $event.preventDefault();
        $event.stopPropagation();
        this.editing = false;
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
    z-index: 101;
    background: var(--editable-background-editing);
}
.container.editing,.container:hover {
    border: 3px solid transparent;
}

.container.readonly:hover {
    cursor: pointer;
    background: var(--editable-background-hover);

}
.container.readonly:hover:after {
   content: "\f304"; 
   font-family: "Font Awesome 5 Free";
   opacity: 0.5;
   font-weight: 900;
   font-size: 1rem;
   font-style: normal;
   position: absolute;
   right:1em; 
   top: 0.5em;
}
.options {
    width: 130px;
}
.value {
    flex-grow: 1;
}
div.backdrop {
    background-color: rgba(0, 0, 0, 0.404);
    position: fixed; 
    top: 0;
    left: 0;
    height: 100%;
    width: 100%;
    z-index: 100;
}
</style>

<style>
.container.editing div[contenteditable="true"] {
    background: var(--editable-background-input);
}
</style>