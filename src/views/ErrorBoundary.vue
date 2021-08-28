<template>
    <slot></slot>    
</template>

<script lang="ts">
import { Vue } from "vue-class-component";
import { useToast } from "primevue/usetoast";

export default class ErrorBoundary extends Vue {
    errorCaptured(err, _vm, _info) {
        const toast = useToast();
        toast.add({severity:'error', summary: 'An error occurred', detail:err, life: 3000});
        return false;
    }
}
</script>