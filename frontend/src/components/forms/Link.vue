<template>
    <a href="#" class="w-link"
        :title="title"
        @click="click($event)">{{ label }} </a>
</template>


<script lang="ts">
import { Options, Vue } from "vue-class-component";
import { Emit, Prop } from "vue-property-decorator";
@Options({
    emits: ['click']
})
export default class Button extends Vue {
    @Prop() to: string;
    @Prop() icon: string;
    @Prop() title: string;
    @Prop() label : string;
    @Prop() color: 'primary' | 'secondary' | 'danger' | 'success' = 'primary';

    @Emit('click') 
    click($event) {
        return $event;
    }
}
</script>

<style scoped>
.w-link {
    color: rgb(49, 49, 100);
    cursor: pointer;  
    text-decoration: none;  
    display: block;
    height: 100%;
    width: 100%;
}

.w-link:hover {
    background-color: gray;
}
</style>