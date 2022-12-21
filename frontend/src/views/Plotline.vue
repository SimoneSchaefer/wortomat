<template>

    <div class="grouping-item-view">
        <div class="submenu">
            <WSubMenu></WSubMenu>
        </div>


        <ScrollPanel  style="width: 100%; height: 100%" >
            <div class="plotlines">
                <div v-for="plotline in enrichedPlotlines" class="plotline" v-bind:key="plotline.id">
                    <h2 class="list-group-item tree-view-item">
                        <EditableLabel v-bind:value="plotline.name" @update-label="updateName(plotline, $event)"
                            :placeHolderTitle="`fallback_labels.no_name.${novelItemKey}`"></EditableLabel>
                    </h2>
                    <div class="plotline-content">
                        <div class="left"></div>
                        <div class="divider"></div>
                        <div class="right">

                            <div class="plotline-event" v-for="item in plotline.children" :key="item.id">
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
                                            class="p-button-text p-button-lg add-button" icon="pi pi-plus"
                                            v-on:click="addChild(plotline, item.position)"></Button>
                                    </div>


                                </div>

                            </div>



                        </div>
                    </div>

                </div>
            </div>
        </ScrollPanel>

    </div>

</template>

<script lang="ts">
import WSubMenu from "@/components/navigation/submenu/SubMenu.vue";
import NovelList from '@/components/novels/NovelList.vue';
import { BaseModel } from '@/models/Base.model';
import { ParentModel } from '@/models/ParentModel';
import { PARENT_ITEM_KEYS } from '@/store/keys';
import { namespace } from "s-vuex-class";
import { mixins, Options, Vue } from 'vue-class-component';
import EditableLabel from "@/components/forms/inline-edit/EditableLabel.vue";
import UpdatableItemMixin from "@/components/mixins/UpdatableItemMixin";
import { ChildModel } from "@/models/ChildModel";
import ScrollPanel from "primevue/scrollpanel";

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
export default class Plotline extends mixins(UpdatableItemMixin) {
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
        view: PARENT_ITEM_KEYS,
        novelId: number,
    }) => Promise<void>;


    addChild(selectedParent: ParentModel, position: number): void {
        const child = new ChildModel();
        child.parentId = selectedParent.id;
        child.position = position;
        child.tags = [];

        this.addNovelItem({ view: this.parentKey, novelItem: child });
    }

    get enrichedPlotlines() {
        const enrichedPlotlines: ParentModel[] = [];
        const allPositions = this.getAllPositions();
        console.log('ALL POSITIONS', allPositions)
        for (let plotline of this.plotlines) {
            const plotlineCopy = { ...plotline };
            for (let position of allPositions) {
                const childAtPosition = plotlineCopy.children.find(child => child.position === position);
                if (!childAtPosition) {
                    console.log('insert child for ' + plotline.name + ' at position ' + position);
                    const dummyChild = { ...new ChildModel(), ...{ position: position } };
                    plotlineCopy.children.splice(position, 0, dummyChild);
                }
            }
            enrichedPlotlines.push(plotlineCopy);
        }

        return enrichedPlotlines;

    }

    checkMove(e) {
        window.console.log("Future index: " + e.draggedContext.futureIndex);
    }

    private getAllPositions() {
        const allPositions = new Set<number>();
        for (let plotline of this.plotlines) {
            const positions = plotline.children.map(child => child.position)
            positions.forEach((position) => allPositions.add(position));
        }
        return allPositions;
    }

    get novelItemKey() {
        return PARENT_ITEM_KEYS.PLOTLINES
    }

    get plotlines() {
        return this.novelItems.get(this.novelItemKey) || [];
    }
}
</script>

<style scoped>
.plotline-content {
    display: flex;
}

.plotline-event {
    height: 5em;
    display: flex;
    margin-bottom: 1em;

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
    width: 20em;
    height: 100%;
    padding: 1em;
}

.list-group-item {
    border: 1px dotted gray;
    cursor: grab;
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
    background: var(--light-background);

}

.add-button {
    width: 100%;
    height: 100%;
}
</style>
