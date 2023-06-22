<template>
    <div class="grouping-item-view">
        <ScrollPanel style="width: 100%; height: 100%" v-if="wordCount">
           
            <div class="p-grid stats-grid">
                <div class="p-col">
                    <Card>
                        <template #title>General Statistics</template>
                        <template #content>
                            <ul>
                                <li>Wordcount: {{ wordCount }}</li>
                                <li>TodoCount: {{ todoCount }}</li>
                                <li>Fixme Count: {{ fixmeCount }}</li>
                                <li>Idea count: {{ ideaCount }}</li>
                            </ul>
                        </template>
                    </Card>
                </div>
                <div class="p-col"></div>

                <div class="p-col"></div>
            </div>
        </ScrollPanel>
    </div>
</template>

<script lang="ts">
import EditableLabel from "@/components/forms/inline-edit/EditableLabel.vue";
import NovelItemKeyAwareMixin from '@/components/mixins/NovelItemKeyAwareMixin';
import TodoMarkerAwareMixin from '@/components/mixins/TodoMarkerAwareMixin';
import WSubMenu from "@/components/navigation/submenu/SubMenu.vue";
import NovelList from '@/components/novels/NovelList.vue';
import { BaseModel } from '@/models/Base.model';
import { ChildModel } from "@/models/ChildModel";
import { ParentModel } from '@/models/ParentModel';
import { PlotlineModel } from '@/models/Plotline.model';
import { PARENT_ITEM_KEYS } from '@/store/keys';
import ScrollPanel from "primevue/scrollpanel";
import { namespace } from "s-vuex-class";
import { mixins, Options } from 'vue-class-component';

const applicationStateModule = namespace("applicationState");
const novelDataModule = namespace("novelData");

@Options({
    components: {
        NovelList,
        WSubMenu,
        EditableLabel
    },
})
export default class Stats extends mixins(NovelItemKeyAwareMixin, TodoMarkerAwareMixin) {
    @novelDataModule.State("_novelItems")
    novelItems!: Map<PARENT_ITEM_KEYS, ParentModel[]>;

    @novelDataModule.State("_loading")
    loading!: boolean;


    @applicationStateModule.Action
    setActiveView!: (view: PARENT_ITEM_KEYS) => Promise<void>;

    @novelDataModule.Action
    loadNovelItems!: ({
        view,
        novelId,
    }) => Promise<void>;

    wordCount: number = null;
    todoCount: number = null;
    fixmeCount: number = null;
    ideaCount: number = null;
    todoDashboard: string[];

    mounted(): void {
        this.setActiveView(this.novelItemKey); // TODO: Move this to link click
        this.loadNovelItems({
            view: PARENT_ITEM_KEYS.PARTS,
            novelId: this.$route.params.id,
        });

        this.$store.subscribe((mutation, store) => {
            if (mutation.type === "novelData/novelItemsLoaded") {
                console.log('LOADED', mutation);
                this.calculateStatistics();


            }
        });

    }


    calculateStatistics() {
        const flatChapters = this.novelItems.get(PARENT_ITEM_KEYS.PARTS).map((parent) => parent.children).flat();
        const chapterContent = flatChapters.reduce((acc, curr) => {
            return acc + (curr.content || '') 
        }, '')
        this.wordCount = chapterContent.split(' ').length;
        this.todoCount = this.getTodoCount(chapterContent);
        this.fixmeCount = this.getFixmeCount(chapterContent);
        this.ideaCount = this.getIdeaCount(chapterContent);

    }
   

    get novelItemKey() {
        return PARENT_ITEM_KEYS.STATS
    }

    get parentKey() {
        return PARENT_ITEM_KEYS.STATS
    }
}
</script>

<style scoped>
.stats-grid {
    padding: 3em;
}
</style>
