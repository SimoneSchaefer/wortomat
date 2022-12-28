<template>

    <div class="grouping-item-view">
        <div class="submenu">
            <WSubMenu :createModel="createModel" :displayOptions="false"></WSubMenu>
        </div>

        <ScrollPanel style="width: 100%; height: 100%">
            <draggable :list="plotlines" group="parents" class="list-group plotlines" ghost-class="ghost"
                drag-class="dragging" @change="parentMoved">
                <transition-group type="transition" :name="'flip-list'">
                    <div v-for="plotline in plotlines" class="plotline" v-bind:key="plotline.id" :style="{ height: getHeight()}">
                        <div class="divider" :style="{
                            cursor: 'grab',
                            height: '100%',
                            width: '10px',
                            backgroundColor: plotline.color,
                            flex: '0.5em 0 0',
                        
                        }"></div>
                        <div class="events">
                            <draggable :list="plotline.children" group="children" class="list-group plotline-events"
                                :id="`parent-id-${plotline.id}`" ghost-class="ghost" drag-class="dragging"
                                @end="childMoved">
                                <transition-group type="transition" :name="'flip-list'">
                                    <div v-for="position in getAllPositions()" v-bind:key="position"
                                        :id="`position-${position}`">
                                        <div v-if="getChildAtPosition(plotline, position)" class="plotline-event"
                                            :id="`child-id-${getChildAtPosition(plotline, position).id}`">
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
                                                icon="pi pi-plus" v-on:click="addChild(plotline, position)" :title="$t('sub_menu.PLOTLINES.add_child')"></Button>
                                        </div>
                                    </div>
                                </transition-group>
                            </draggable>
                        </div>
                    </div>
                </transition-group>
            </draggable>
        </ScrollPanel>
    </div>
</template>

<script lang="ts">
import EditableLabel from "@/components/forms/inline-edit/EditableLabel.vue";
import NovelItemKeyAwareMixin from '@/components/mixins/NovelItemKeyAwareMixin';
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
export default class Plotline extends mixins(NovelItemKeyAwareMixin) {
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

    @novelDataModule.Action
    moveParent!: (payload: {
        key: PARENT_ITEM_KEYS;
        novelId: number;
        parentId: number;
        oldPosition: number;
        newPosition: number;
    }) => Promise<void>;

    @novelDataModule.Action
    moveChild!: (payload: {
        key: PARENT_ITEM_KEYS;
        novelId: number;
        childToMove: number;
        newParentId: number;
        newPosition: number;
    }) => Promise<void>;

    parentMoved($event) {
        if (!$event.removed) {
            const parentId = $event.moved.element.id;
            const newIndex = $event.moved.newIndex;
            const oldIndex = $event.moved.oldIndex;
            this.moveParent({
                key: this.parentKey,
                novelId: this.novelId,
                parentId: parentId,
                oldPosition: oldIndex,
                newPosition: newIndex,
            });
        }

    }
    childMoved($event) {
        if (!$event.to.className.includes("trashzone")) {
            const parentTo = $event.to.id.replace("parent-id-", "");
            const newPosition = $event.newIndex;
            const childId = $event.clone.children[0].id.replace("child-id-", "");
            this.moveChild({
                key: this.parentKey,
                novelId: this.novelId,
                childToMove: childId,
                newParentId: parentTo,
                newPosition: newPosition,
            });
        }
    }

    getHeight() {
        return `${this.getAllPositions().length * 6}em`;
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

    getAllPositions() {
        const allPositions = new Set<number>();
        for (let plotline of this.plotlines) {
            const positions = plotline.children.map(child => child?.position)
            positions.forEach((position) => allPositions.add(position));
        }
        const maxPosition = allPositions.size > 0 ? Math.max(...allPositions) + 1 : 0;
        const allPos = [];
        for (let i = 0; i <= maxPosition; i++) {
            allPos.push(i);
        }
        return allPos;
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
    width: 2.357rem;
    height: 2.357rem;
}
</style>
