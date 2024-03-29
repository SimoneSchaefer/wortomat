import { VuexModule, Module, Mutation, Action } from "vuex-class-modules";

import { BaseModel } from "@/models/Base.model";
import { NovelModel } from "@/models/Novel.model";
import { TagModel } from "@/models/Tag.model";
import { TimelineEventModel } from "@/models/TimelineEvent";

import { GroupingNovelItemService } from "@/service/GroupingNovelItemService";
import { NovelService } from "@/service/NovelService";
import { TimelineService } from "@/service/TimelineService";

import { PARENT_ITEM_KEYS } from "./keys";
import { ParentModel } from "@/models/ParentModel";
import { SettingsService } from '@/service/SettingsService';
import { STATUS } from '@/models/Status';


@Module({ generateMutationSetters: true })
export default class NovelDataModule extends VuexModule {
    private _groupingNovelItemService = new GroupingNovelItemService();
    private _timelineService = new TimelineService();
    private _novelService = new NovelService();
    private _settingsService = new SettingsService();

    private _novelId: number = undefined;
    private _novels = [];
    private _settings = {};
    private _loading = false;
    private _novelItems: Map<PARENT_ITEM_KEYS, BaseModel[]> = new Map(); // TODO: make BaseModel
    private _deletedNovelItems: Map<PARENT_ITEM_KEYS, BaseModel> = new Map(); // TODO: make BaseModel
    private _tags: Map<PARENT_ITEM_KEYS, TagModel[]> = new Map();

    get sortedTimelineEvents(): TimelineEventModel[] {
        const allItems = (this._novelItems.get(PARENT_ITEM_KEYS.TIMELINE) || []) as TimelineEventModel[];
        return allItems;
    }

    @Mutation
    public novelOpened(novelId: number): void {
        this.clearNovel();
        this._novelId = novelId;
    }

    public clearNovel() {
        this._novelId = undefined;
        this._novelItems = new Map();
        this._tags = new Map();
    }

    @Mutation
    public novelAdded(novel: NovelModel): void {
        this._novels.push(novel);
    }

    @Mutation
    public novelDeleted(novel: NovelModel): void {
        const index = this._novels.findIndex(n => n.id === novel.id);
        if (index > -1) this._novels.splice(index, 1);
    }

    @Mutation
    public novelUpdated(novel: NovelModel): void {
        const index = this._novels.findIndex(n => n.id === novel.id);
        if (index > -1) this._novels.splice(index, 1, novel);
    }

    @Mutation
    public novelItemUpdated(update: { view: PARENT_ITEM_KEYS, novelItem: NovelModel }): void {
        if (update.novelItem.parentId) {
            const parent = this.findParentForChild(update.view, update.novelItem);
            const index = parent['children'].findIndex(child => child.id === update.novelItem.id);
            parent['children'].splice(index, 1, update.novelItem);
            const newParents = [...this._novelItems.get(update.view)];
            this._novelItems.set(update.view, newParents);
       } else {
            const index = this.findParentIndex(update.view, update.novelItem);
            if (index > -1) this._novelItems.get(update.view).splice(index, 1, update.novelItem);
        }
    }

    @Mutation
    public novelItemAdded(update: { view: PARENT_ITEM_KEYS, novelItem: NovelModel }): void {
        if (update.novelItem.parentId) {
            const parent = this.findParentForChild(update.view, update.novelItem);
            parent['children'].splice(update.novelItem.position, 0, update.novelItem);
            const newParents = [...this._novelItems.get(update.view)];
            this._novelItems.set(update.view, newParents);
        } else {
            this._novelItems.get(update.view).push(update.novelItem);
        }
    }

    @Mutation
    private tagAdded(update: { view: PARENT_ITEM_KEYS, tag: TagModel }) {
        if (!this._tags.get(update.view)) this._tags.set(update.view, []);
        this._tags.get(update.view).push(update.tag);
    }

    @Mutation
    public novelItemDeleted(update: { view: PARENT_ITEM_KEYS, novelItem: BaseModel }): void {
        if (update.novelItem.parentId) {
            const parent = this.findParentForChild(update.view, update.novelItem);
            const index = parent['children'].findIndex(child => child.id === update.novelItem.id);
            parent['children'].splice(index, 1);
        } else {
            const index = this._novelItems.get(update.view).findIndex(parent => parent.id === update.novelItem.id);
            this._novelItems.get(update.view).splice(index, 1);
        }
    }
    @Mutation
    public novelItemChildDeleted(update: { view: PARENT_ITEM_KEYS, novelItem: number }): void {
        const parent = this.findParentForChild(update.view, update.novelItem);
        const index = parent['children'].findIndex(child => child.id === update.novelItem);
        parent['children'].splice(index, 1);
    }

    @Mutation
    public novelsLoaded(novels: NovelModel[]): void {
        this._novels = novels;
    }

    @Mutation
    public settingsLoaded(settings: Record<string,boolean>): void {
        this._settings = settings;
    }

    @Mutation
    public isLoading(loading: boolean): void {
        this._loading = loading;
    }

    @Mutation
    public novelItemsLoaded(update: { view: PARENT_ITEM_KEYS, novelItems: BaseModel[] }): void {
        this._novelItems.set(update.view, update.novelItems);
    }

    @Mutation
    public deletedNovelItemsLoaded(update: { view: PARENT_ITEM_KEYS, novelItems: BaseModel }): void {
        this._deletedNovelItems.set(update.view, update.novelItems);
    }

    @Mutation
    public tagsLoaded(update: { view: PARENT_ITEM_KEYS, tags: TagModel[] }): void {
        this._tags.set(update.view, update.tags);
    }

    @Action
    public async addReference(payload: { event: TimelineEventModel, item: BaseModel, key: PARENT_ITEM_KEYS }): Promise<void> {
        this._timelineService.addReference(this._novelId, payload.event, payload.item, payload.key).then(result => {
            this.novelItemUpdated({ view: PARENT_ITEM_KEYS.TIMELINE, novelItem: result.data })
        });
    }

    @Action
    public async deleteReference(payload: { event: TimelineEventModel, item: BaseModel, key: PARENT_ITEM_KEYS }): Promise<void> {
        this._timelineService.deleteReference(this._novelId, payload.event, payload.item, payload.key).then(result => {
            this.novelItemUpdated({ view: PARENT_ITEM_KEYS.TIMELINE, novelItem: result.data })
        });
    }

    @Action
    public async openNovel(novelId: number): Promise<void> {
        this.novelOpened(novelId);
    }

    @Action
    public async addNovel(novel: NovelModel): Promise<void> {
        this._novelService.create(novel).then(result => {
            this.novelAdded(result.data);
        });
    }

    @Action
    public async deleteNovel(novel: NovelModel): Promise<void> {
        this._novelService.delete(novel).then(() => {
            this.novelDeleted(novel);
        });
    }

    @Action
    public async updateNovel(novel: NovelModel): Promise<void> {
        this._novelService.update(novel).then(result => {
            this.novelUpdated(result.data);
        });
    }

    @Action
    public async loadNovels(): Promise<void> {
        this._novelService.getAll().then(result => {
            this.novelsLoaded(result.data);

        });
    }

    @Action
    public async loadSettings(): Promise<void> {
        this._settingsService.getAll().then(result => {
            this.settingsLoaded(result.data);
        });
    }

    @Action
    public async updateNovelItem(payload: { view: PARENT_ITEM_KEYS, novelItem: BaseModel }): Promise<void> {
        this._groupingNovelItemService.update(payload.view, this._novelId, payload.novelItem).then(result => {
            this.novelItemUpdated({ view: payload.view, novelItem: result.data });
        });
    }

    @Action
    public async addNovelItem(payload: { view: PARENT_ITEM_KEYS, novelItem: BaseModel }): Promise<void> {
        this._groupingNovelItemService.create(payload.view, this._novelId, payload.novelItem).then(result => {
            this.novelItemAdded({ view: payload.view, novelItem: result.data });
        });
    }

    @Action
    public async addTag(payload: { view: PARENT_ITEM_KEYS, novelItem: TagModel }): Promise<void> {
        this._groupingNovelItemService.createTag(payload.view, this._novelId, payload.novelItem).then(result => {
            this.tagAdded({ view: payload.view, tag: result.data });
        });
    }


    @Action
    public async deleteNovelItem(payload: { view: PARENT_ITEM_KEYS, novelItem: BaseModel }): Promise<void> {
        this._groupingNovelItemService.delete(payload.view, this._novelId, payload.novelItem).then(() => {
            this.novelItemDeleted({ view: payload.view, novelItem: payload.novelItem });
        });
    }

    @Action
    public async deleteNovelItemChild(payload: { view: PARENT_ITEM_KEYS, novelItem: number }): Promise<void> {
        this._groupingNovelItemService.deleteChild(payload.view, this._novelId, payload.novelItem).then((result) => {
            this.loadNovelItems({ view: payload.view, novelId: this._novelId });
            // this.novelItemsLoaded({ view: payload.view, novelItems: result.data}); // TODO do not reload everything, only the relevant parts
        });
    }
    @Action
    public async deleteNovelItemParent(payload: { view: PARENT_ITEM_KEYS, novelItem: number }): Promise<void> {
        this._groupingNovelItemService.deleteParent(payload.view, this._novelId, payload.novelItem).then((result) => {
            this.loadNovelItems({ view: payload.view, novelId: this._novelId });
            //  this.novelItemsLoaded({ view: payload.view, novelItems: result.data}); // TODO do not reload everything, only the relevant parts
        });
    }

    @Action
    public async loadNovelItems(payload: { view: PARENT_ITEM_KEYS, novelId: number }): Promise<void> {
        this.isLoading(true);
        const { view, novelId } = payload;
        Promise.all([
            this._groupingNovelItemService.list(view, novelId),
            // this._groupingNovelItemService.listDeleted( view, novelId),
            this._groupingNovelItemService.tags(view, novelId),
            this._groupingNovelItemService.list(PARENT_ITEM_KEYS.PLOTLINES, novelId),
        ]).then(result => {
            const cleanNovelItems = [...result[0].data].map((parent) => {
                const cleanChildren = parent.children.map((child) => {
                    return {
                        ...child,
                        status: STATUS[child.status]
                    }
                })
                return {
                    ...parent,
                    children: cleanChildren
                }

            })
            this.novelItemsLoaded({ view: view, novelItems: result[0].data });
            // this.deletedNovelItemsLoaded( { view: view, novelItems: result[1].data });
            this.tagsLoaded({ view: view, tags: result[1].data });
            this.novelItemsLoaded({ view: PARENT_ITEM_KEYS.PLOTLINES, novelItems: result[2].data });
            this.isLoading(false);
        });
    }

    @Action
    public async moveParent(payload: {
        key: PARENT_ITEM_KEYS,
        novelId: number,
        parentId: number,
        oldPosition: number
        newPosition: number
    }): Promise<void> {
        const { key, novelId, parentId, oldPosition, newPosition } = payload;
        this._groupingNovelItemService.moveParent(key, novelId, parentId, oldPosition, newPosition).then((result) => {
            this.novelItemsLoaded({ view: key, novelItems: result.data }); // TODO do not reload everything, only the relevant parts
        });
    }

    @Action
    public async moveChild(payload: {
        key: PARENT_ITEM_KEYS,
        novelId: number,
        childToMove: number,
        newParentId: number,
        newPosition: number
    }): Promise<void> {
        const { key, novelId, childToMove, newParentId, newPosition } = payload;
        this._groupingNovelItemService.moveChild(key, novelId, childToMove, newParentId, newPosition).then((result) => {
            this.novelItemsLoaded({ view: key, novelItems: result.data }); // TODO do not reload everything, only the relevant parts
        });
    }


    private findParentIndex(view: PARENT_ITEM_KEYS, parent: BaseModel): number {
        return this._novelItems.get(view).findIndex(n => n.id === parent.id);
    }

    private findParentForChild(view: PARENT_ITEM_KEYS, child: BaseModel | number): BaseModel | undefined {
        if (this.isNumber(child)) {
            console.log('child is number')
            for (const parent of this._novelItems.get(view)) {
                const c = (parent as ParentModel).children.find(c => c.id === child);
                if (c) {
                    return parent;
                }
            }
        }
        return this._novelItems.get(view).find(parent => parent.id === (child as BaseModel).parentId);
    }

    private isNumber(n) {
        return !isNaN(parseFloat(n)) && !isNaN(n - 0);
    }
}

