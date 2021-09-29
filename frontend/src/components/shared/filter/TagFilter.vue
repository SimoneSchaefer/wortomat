<template>
<div class="tagfilter">
    <AutoComplete :multiple="true" :completeOnFocus="true" v-model="selectedTags" :suggestions="filteredTags" @complete="searchTags($event)" @item-unselect="updateStore($event)" @item-select="updateStore">
        <template #item="slotProps">
            {{ slotProps.item.name }}
        </template>
        <template #chip="slotProps">
            {{ slotProps.value.name }}
        </template>
    </AutoComplete>
</div>
</template>



<script lang="ts">
import { NOVEL_ITEM_KEYS } from '@/store/keys';
import { Options, Vue } from 'vue-class-component';
import { Prop } from 'vue-property-decorator';
@Options({
  components: {  }
})
export default class TagFilter extends Vue {
    @Prop() novelItemKey: NOVEL_ITEM_KEYS;

    selectedTags = [];
    filteredTags = [];    

    mounted(): void {
        this.updateStore();
    }

    get hasTags(): boolean {
        return this.$store.getters.tags.length > 0;
    }

    updateStore(): void {
        this.$store.dispatch('filterTags', {
            key: this.novelItemKey,
            tags: [...this.selectedTags]
        });
    }

    searchTags($event: { query: string }): void {      
        this.filteredTags = [...this.$store.getters.tags.filter(tag => tag.name.includes($event.query))];    
    }
}
</script>

<style>
.tagfilter {
    display: flex;
    width: 30em;
}
.tagfilter ul {
    margin-top: 0.3em !important;
    margin-bottom: 0.3em !important;
}
.tagfilter .p-autocomplete {
    width: 100%;
}
.tagfilter .p-autocomplete .p-inputtext {
    width: 100%;
    margin: 0.8em;
    border: 1px solid #efefef;
}

.tagfilter .p-autocomplete:after {
   content: "\f02c"; 
   font-family: "Font Awesome 5 Free";
   opacity: 0.5;
   font-weight: 900;
   font-size: 1rem;
   font-style: normal;
   position: absolute;
   right:1.5em; 
   top: 1.0em;
}
.p-inputtext {
    border: 1px solid var(--menu-border-color) !important;
}

.p-focus {
    outline: none !important;
    box-shadow: none;
    border: none;

}

</style>