<template>
<div class="tags-container">
    <div v-for="tag in tags" :key="tag.id">
        <div class="tag">
            <EditableTag :tag="tag"></EditableTag>
        </div>
    </div>
</div>
</template>

<script lang="ts">
import { TagModel } from "@/models/Tag.model";
import EditableTag from "@/components/forms/inline-edit/EditableTag.vue";
import { Options, Vue } from "vue-class-component";

@Options({
  components: { EditableTag }
})
export default class Tags extends Vue {
    get tags(): TagModel[] {
        return this.$store.getters.tags;
    }
}
</script>

<style scoped>
.tags-container {
    padding: 3em;
    display: flex;
}

.tag {
    margin-right: 1em;
}
</style>
