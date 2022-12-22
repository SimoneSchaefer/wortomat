<template>

    <div class="grouping-item-view">
        <div class="submenu">
            <WSubMenu :createModel="createModel"></WSubMenu>
        </div>


        <ScrollPanel style="width: 100%; height: 100%">

            <draggable :list="plotlines" group="parents" class="list-group plotlines" ghost-class="ghost"
                drag-class="dragging" @change="parentMoved">
                <transition-group type="transition" :name="'flip-list'">
                    <div v-for="plotline in plotlines" class="plotline" v-bind:key="plotline.id">
                        <div class="divider" :style="{
                            height: '100%',
                            width: '10px',
                            backgroundColor: plotline.color,
                            flex: '0.5em 0 0',
                        }"></div>
                        <div class="events">

                            <draggable :list="plotline.children" group="children" class="list-group plotline-events"
                                ghost-class="ghost" drag-class="dragging" @change="childMoved">
                                <transition-group type="transition" :name="'flip-list'">
                                    <div v-for="position in getAllPositions()" v-bind:key="position">
                                        <div v-if="getChildAtPosition(plotline, position)" class="plotline-event">
                                            <div class="connection"></div>
                                            <div class="list-group-item tree-view-item">
                                                <b>
                                                    <EditableLabel
                                                        v-bind:value="getChildAtPosition(plotline, position).name"
                                                        @update-label="updateName(getChildAtPosition(plotline, position), $event)"
                                                        :placeHolderTitle="`fallback_labels.no_name.${novelItemKey}`">
                                                    </EditableLabel>
                                                </b>
                                                <div>
                                                    <EditableLabel
                                                        v-bind:value="getChildAtPosition(plotline, position).summary"
                                                        @update-label="updateSummary(getChildAtPosition(plotline, position), $event)"
                                                        :placeHolderTitle="`fallback_labels.no_summary`">
                                                    </EditableLabel>
                                                </div>
                                            </div>
                                        </div>
                                        <div v-else class="add-event">
                                            <Button class="p-button p-button-lg p-button-rounded add-button"
                                                icon="pi pi-plus" v-on:click="addChild(plotline, position)"></Button>
                                        </div>
                                    </div>
                                </transition-group>
                            </draggable>

                        </div>
                    </div>
                </transition-group>
            </draggable>










            <!-- <div class="">
                <draggable :list="enrichedPlotlines" group="parents" class="list-group plotlines" ghost-class="ghost"
                    drag-class="dragging" @change="parentMoved">
                    <transition-group type="transition" :name="'flip-list'">


                        <div v-for="plotline in enrichedPlotlines" class="plotline" v-bind:key="plotline.id">
                            <div class="plotline-content">
                                <div class="left"></div>
                                <div :style="{
                                    backgroundColor: plotline.color,
                                    flex: '0.5em 0 0',
                                    cursor: 'grab'
                                }"></div>
                                <div class="right">
                                    <draggable :list="plotline.children" group="children" ghost-class="ghost"
                                        :options="{ draggable: '.draggingEnabled' }" drag-class="dragging"
                                        @start="checkMove" @change="childMoved" :id="`parent-${plotline.id}`">
                                        <transition-group type="transition" :name="'flip-list'">
                                            <div class="plotline-event" v-for="(item, index) in plotline.children"
                                                :key="index"
                                                :class="{ 'draggingEnabled': !!item.id, 'draggingDisabled': !!!item.id }">
                                                <div class="connection"></div>
                                                <div class="list-group-item tree-view-item">

                                                    <div v-if="item.id">
                                                        <b>
                                                            <EditableLabel v-bind:value="item.name"
                                                                @update-label="updateName(item, $event)"
                                                                :placeHolderTitle="`fallback_labels.no_name.${novelItemKey}`">
                                                            </EditableLabel>
                                                        </b>
                                                        <div>
                                                            <EditableLabel v-bind:value="item.summary"
                                                                @update-label="updateSummary(item, $event)"
                                                                :placeHolderTitle="`fallback_labels.no_summary`">
                                                            </EditableLabel>
                                                        </div>
                                                    </div>
                                                    <div v-else>
                                                        <i>Empty slot</i><br>
                                                        <Button data-cy="add-event" label="Create a new event"
                                                            class="p-button-text p-button-lg add-button"
                                                            icon="pi pi-plus"
                                                            v-on:click="addChild(plotline, item.position)"></Button>
                                                    </div>
                                                </div>
                                            </div>
                                        </transition-group>
                                    </draggable>
                                </div>
                            </div>
                        </div>
                    </transition-group>
                </draggable>
            </div>-->
        </ScrollPanel>
    </div>
</template>

<script lang="ts">
import EditableLabel from "@/components/forms/inline-edit/EditableLabel.vue";
import WSubMenu from "@/components/navigation/submenu/SubMenu.vue";
import NovelList from '@/components/novels/NovelList.vue';
import { BaseModel } from '@/models/Base.model';
import { ChildModel } from "@/models/ChildModel";
import { ParentModel } from '@/models/ParentModel';
import { PlotlineModel } from '@/models/Plotline.model';
import { PARENT_ITEM_KEYS } from '@/store/keys';
import ScrollPanel from "primevue/scrollpanel";
import { namespace } from "s-vuex-class";
import { Options, Vue } from 'vue-class-component';

const applicationStateModule = namespace("applicationState");
const novelDataModule = namespace("novelData");

const novelModule = namespace("novelData");

@Options({
    components: {
        NovelList,
        WSubMenu,
        EditableLabel
    },
})
export default class Plotline extends Vue/*mixins(UpdatableItemMixin)*/ {
    @novelDataModule.State("_novelItems")
    novelItems!: Map<PARENT_ITEM_KEYS, ParentModel[]>;

    @novelDataModule.State("_loading")
    loading!: boolean;

    mounted(): void {
        this.setActiveView(this.novelItemKey); // TODO: Move this to link click
        this.loadNovelItems({
            view: this.novelItemKey,
            novelId: this.$route.params.id,
        });
    }

    @novelDataModule.Action
    updateNovelItem!: (payload: {
        view: PARENT_ITEM_KEYS;
        novelItem: BaseModel;
    }) => Promise<void>;


    @novelDataModule.Action
    addNovelItem!: (payload: {
        view: PARENT_ITEM_KEYS;
        novelItem: BaseModel;
    }) => Promise<void>;

    @applicationStateModule.Action
    setActiveView!: (view: PARENT_ITEM_KEYS) => Promise<void>;

    @novelDataModule.Action
    loadNovelItems!: ({
        view,
        novelId,
    }) => Promise<void>;

    checkMove($event) {
        return $event.item.className.includes('draggingEnabled');
    }

    parentMoved($event) {
        console.log('event', $event)

    }
    childMoved($event) {
        console.log('child moved', $event);


    }

    getChildAtPosition(parent: ParentModel, position: number) {
        return parent.children.find(child => child.position === position);
    }

    createModel() {
        const plotline = new PlotlineModel();
        plotline.color = ` #${Math.floor(Math.random() * 16777215).toString(16)}`;
        return plotline;
    }

    addChild(selectedParent: ParentModel, position: number): void {
        const child = new ChildModel();
        child.parentId = selectedParent.id;
        child.position = position;
        child.tags = [];

        this.addNovelItem({ view: this.parentKey, novelItem: child });
    }

    get enrichedPlotlines() {
        const enrichedPlotlines: PlotlineModel[] = [];
        const allPositions = this.getAllPositions();

        const plotlines = this.plotlines;
        for (let plotline of plotlines) {
            const plotlineCopy = Object.assign(new PlotlineModel(), plotline);
            plotlineCopy.children = [...plotline.children];
            for (let position of allPositions) {
                const childAtPosition = plotlineCopy.children.find(child => child.position === position);
                if (!childAtPosition) {
                    const dummyChild = { ...new ChildModel(), ...{ position: position } };
                    plotlineCopy.children.splice(position, 0, dummyChild);
                }
            }

            const lastPosition = Math.max(...allPositions) + 1;
            const dummyChild = { ...new ChildModel(), ...{ position: lastPosition } };
            plotlineCopy.children.splice(lastPosition, 0, dummyChild);

            enrichedPlotlines.push(plotlineCopy);
        }

        return enrichedPlotlines;

    }


    getAllPositions() {
        const allPositions = new Set<number>();
        for (let plotline of this.plotlines) {
            const positions = plotline.children.map(child => child.position)
            positions.forEach((position) => allPositions.add(position));
        }
        const maxPosition = Math.max(...allPositions);
        allPositions.add(maxPosition + 1);

        const sorted = Array.from(allPositions).sort()
        return sorted;
    }

    get novelItemKey() {
        return PARENT_ITEM_KEYS.PLOTLINES
    }

    get parentKey() {
        return PARENT_ITEM_KEYS.PLOTLINES
    }

    get plotlines(): PlotlineModel[] {
        const fromStore = this.novelItems.get(this.novelItemKey);
        if (fromStore) {
            return fromStore.slice() as PlotlineModel[];
        }
        return [];
    }

    updateName(oldItem: BaseModel, newValue: string): void {
        this.updateItem(oldItem, { name: newValue });
    }

    updateSummary(oldItem: BaseModel, newValue: string): void {
        this.updateItem(oldItem, { summary: newValue });
    }

    updateExtendedSummary(oldItem: BaseModel, newValue: string): void {
        this.updateItem(oldItem, { extended_summary: newValue });
    }

    updateContent(oldItem: BaseModel, newValue: string): void {
        this.updateItem(oldItem, { content: newValue });
    }

    updateImages(oldItem: BaseModel, images: Array<{ id: number, name: string }>): void {
        this.updateItem(oldItem, { images: images });
    }

    updateItem(oldItem: BaseModel, overrideValues: Record<string, any>) {
        const newItem = Object.assign({}, oldItem, overrideValues);
        this.updateNovelItem({ view: this.parentKey, novelItem: newItem });
    }
}
</script>

<style scoped>
.draggingDisabled {
    cursor: not-allowed;
    pointer-events: none;
}

.plotline-content {
    display: flex;
}

.plotline-event {
    height: 5em;
    display: flex;
    margin-bottom: 1em;

}

.add-event {
    position: relative;
    left: -25px;
    height: 5em;
    margin-bottom: 1em;
    top: 50%;
    display: flex;
    align-items: center;
}

.events {
    flex: 100% 0 1;
}

.connection {
    width: 20px;
    background-color: #3e3e3e;
    height: 5px;
    left: 0%;
    top: 50%;
    position: relative;
}

.left {
    width: 1em;
    flex-grow: 0;
    flex-shrink: 1;
}

.right {
    flex-grow: 1;
    flex-shrink: 0;
    width: 100%;
}

.divider {
    flex: 0.5em 0 0;
    background-color: purple;
}

.grouping-item-view {
    width: 100%;
    height: calc(100vh - 5rem);
    display: flex;
}

.draggingEnabled {
    cursor: grab;
}

.draggingDisabled {
    cursor: not-allowed;
}

.submenu {
    flex-grow: 0;
    justify-content: center;
    width: 5rem;
    height: calc(100vh - 5rem);
    z-index: 1;
    border-bottom: 1px solid rgba(0, 0, 0, 0.63);
    box-shadow: 0 5px 10px rgba(0, 0, 0, 0.5);
    -webkit-box-shadow: 0 5px 10px rgba(0, 0, 0, 0.5);
    -moz-box-shadow: 0 5px 10px rgba(0, 0, 0, 0.5);
}

.plotlines {
    margin: 1em;
    display: flex;
    height: 100%;
    column-gap: 1em;
}

.plotline {
    width: 30em;
    height: 100%;
    padding: 1em;
    display: flex;
}

.list-group-item {
    border: 1px dotted gray;
    cursor: grab;
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
    background: var(--light-background);
    width: 100%;

}

.add-button {
    width: 100%;
    height: 100%;
}
</style>
