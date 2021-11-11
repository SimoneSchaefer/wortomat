<template>
<Dialog :visible="displayDialog" :modal="true">
    <template #header>
    <h3>Header</h3>
    </template>
        <WNovelItemDropdown 
            @change="selectChapter" 
            :items="chapters"
            :novelItemKey="chapterNovelItemKey" 
            placeHolder="timeline.select_chapter">
        </WNovelItemDropdown>
        <br />

        <WNovelItemDropdown 
            @change="selectResearch" 
            :items="research"
            :novelItemKey="researchNovelItemKey" 
            placeHolder="timeline.select_research">
        </WNovelItemDropdown>

    <template #footer>
        <Button @click="cancel" label="No" icon="pi pi-times" class="p-button-text"/>
        <Button @click="save" label="Yes" icon="pi pi-check" autofocus />
    </template>
</Dialog>
 
</template>

<script lang="ts">
import { NOVEL_ITEM_KEYS } from "@/store/keys";
import { Options, Vue } from "vue-class-component";
import { TimelineEventModel } from "@/models/TimelineEvent";
import { Emit, Prop } from "vue-property-decorator";
import EditableDate from "@/components/shared/inline-edit/EditableDate.vue";
import EditableLabel from "@/components/shared/inline-edit/EditableLabel.vue";
import WButton from '@/components/shared/Button.vue';
import WConfirmDialog from '@/components/shared/ConfirmDialog.vue';
import { ChapterService } from "@/service/Chapter.service";
import { ResearchService } from "@/service/Research.service";
import WNovelItemDropdown from '@/components/shared/NovelItemDropdown.vue';
import { getAllItems } from "@/store/getters";
import { ChapterModel } from "@/models/Chapter.model";
import { ResearchModel } from "@/models/Research.model";

@Options({
  components: {
      EditableDate,
      EditableLabel,
      WButton,
      WConfirmDialog,
      WNovelItemDropdown
  },
  emits: [ 'save', 'cancel']
})
export default class WTimeline extends Vue {
    @Prop() event: TimelineEventModel;
    displayDialog = false;
    selectedResearch = [];
    selectedChapters = [];

    @Emit('cancel')
    cancel() {
        return true;
    }

    @Emit('save')
    save() {
        return {
            chapters: this.selectedChapters,
            research: this.selectedResearch
        };
    }

    selectChapter(chapter: ChapterModel) {
        this.selectedChapters.push(chapter);
    }

    selectResearch(research: ResearchModel) {
        this.selectedResearch.push(research);
    }


    get chapters() {
        return this.getFlatList(NOVEL_ITEM_KEYS.PARTS, NOVEL_ITEM_KEYS.CHAPTERS);
    }

    get research() {
        return this.getFlatList(NOVEL_ITEM_KEYS.RESEARCH_GROUPS, NOVEL_ITEM_KEYS.RESEARCH);
    }

    private getFlatList(parentKey: NOVEL_ITEM_KEYS, childKey: NOVEL_ITEM_KEYS) {
        let flatList = [];
        let groups = getAllItems(this.$store.state, parentKey);
        for (let group of groups) {
        flatList = flatList.concat(group[childKey]);
        }
        return flatList;
    }

    get novelItemKey() {
        return NOVEL_ITEM_KEYS.TIMELINE;
    }

    get chapterNovelItemKey() {
        return NOVEL_ITEM_KEYS.CHAPTERS;
    }

    get researchNovelItemKey() {
        return NOVEL_ITEM_KEYS.RESEARCH;
    }

    get chapterService() {
        return new ChapterService();
    }
    
    get researchService() {
        return new ResearchService();
    }
}
</script>
