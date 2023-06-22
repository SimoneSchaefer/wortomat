<template>

<InlineEdit @start-edit="onStartEdit" @update="updateStatus" @cancel="cancel">
        <template v-slot:editing>
            <i v-for="stat in [0, 1, 2, 3, 4, 5]" :key="`${stat}-${draft}`" 
                class="fa rating-button" 
                :class="[{ active: isActive(stat), }, getIcon(stat)]" 
                :title="getTranslation(stat)" 
                @click="updateDraft(stat)">            
            </i>

       </template>
        <template v-slot:readonly>
            <div class="readonly dummy underline">
                <i class="fa" :class="[getIcon(selected)]"></i> 
                {{  getTranslation(selected) }}
            </div>
        </template>
    </InlineEdit>


   <!--
     <i class="fa rating-button" :class="[{ active: !status, }, getIcon(0)]" :title="getTranslation(0)" @click="status = 0"></i>
    <i class="fa rating-button" :class="[{ active: status === 1 }, getIcon(1)]" :title="getTranslation(1)" @click="status = 1"></i>
    <i class="fa rating-button" :class="[{ active: status === 2  }, getIcon(2)]" :title="getTranslation(2)" @click="status = 2"> </i>
    <i class="fa rating-button" :class="[{ active: status === 3  }, getIcon(3)]" :title="getTranslation(3)" @click="status = 3"> </i>
    <i class="fa rating-button" :class="[{ active: status  === 4 }, getIcon(4)]" :title="getTranslation(4)" @click="status = 4"></i>
    <i class="fa rating-button" :class="[{ active: status  === 5 }, getIcon(5)]" :title="getTranslation(5)" @click="status = 5"></i>
   -->

    <!--<Rating v-model="status" :stars="5" onIcon="pi pi-heart-fill" offIcon="pi pi-heart" cancelIcon="pi pi-times"/>-->
</template>
  
<script lang="ts">
import { STATUS, STATUS_TO_ICON, STATUS_TO_TRANSLATION } from '@/models/Status';
import { Options, Vue } from "vue-class-component";
import { Emit, Prop } from "vue-property-decorator";
import InlineEdit from '@/components/forms/inline-edit/InlineEdit.vue';

@Options({
    components: { InlineEdit },
    emits: ['select-status']
})
export default class Status extends Vue {
    @Prop()
    selected!: number | undefined;

    draft!: number | undefined;

    isActive(status: number) {
        return this.draft === status
    }
    getIcon(status: number) {
        return `fa-${STATUS_TO_ICON[status]}`;
    }

    getTranslation(status: number) {
        return this.$t(STATUS_TO_TRANSLATION[status]);
    }

    updateStatus() {
        this.selectStatus(this.draft);
    }

    updateDraft(status: number) {
        this.draft = status;
        this.$forceUpdate();
    }

    cancel() {
        this.draft = this.selected;
    }

    onStartEdit() {
        this.draft = this.selected;
    }

    get status() {
        console.log('STATUS', this.status)
        return this.selected;
    }

    set status(status: number) {
        console.log('SET STATUS', status)
        // this.selectStatus(status);
        this.draft = status;
    }

    @Emit('select-status')
    selectStatus(status: number) {       
        return status;
    }


}

</script>
  
  
<style scoped>

.rating-button {
    font-size: 1.2em;
    color: var(--gray-400);
    padding: 0.3em;
    cursor: pointer;
}

.rating-button:hover {
    color: var(--primary-400);

}
.active {
    color: var(--primary-color);
}
.dummy {
    color: rgba(128, 128, 128, 0.5);
    max-width: 14em;
}
</style>