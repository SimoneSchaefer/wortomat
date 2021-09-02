<template>
    <div class="sheet">
        <slot name="content" v-bind:item="baseModel"></slot>
    </div>
</template>

<script lang="ts">
import { Options, Vue } from 'vue-class-component';
import { Prop } from 'vue-property-decorator';
import { BaseModel } from '@/models/Base.model';

@Options({
  components: { }
})
export default class NovelItemSheet extends Vue {
    @Prop() baseModel!: BaseModel;
}
</script>