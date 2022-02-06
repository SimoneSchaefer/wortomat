import { BaseModel } from "@/models/Base.model";
import { NovelModel } from "@/models/Novel.model";
import { TagModel } from "@/models/Tag.model";
import { GroupingNovelItemService } from "@/service/GroupingNovelItemService";
import { NovelService } from "@/service/NovelService";
import { VuexModule, Module, Mutation, Action } from "vuex-class-modules";
import { PARENT_ITEM_KEYS } from "./keys";

@Module({ generateMutationSetters: true })
export default class NovelDataModule extends VuexModule {
    private _groupingNovelItemService = new GroupingNovelItemService();
    private _novelService = new NovelService(); 
    private _novelId: number = undefined;
    private _novels = [];
    private _loading = false;
    private _novelItems: Map<PARENT_ITEM_KEYS, BaseModel[]> = new Map();

    @Mutation
    public novelOpened(novelId: number): void {
        this._novelId = novelId;
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
        } else {
            const index = this.findParentIndex(update.view, update.novelItem);
            if (index > -1) this._novelItems.get(update.view).splice(index, 1, update.novelItem);   
        } 
    }

    @Mutation
    public novelItemAdded(update: { view: PARENT_ITEM_KEYS, novelItem: NovelModel }): void {
        if (update.novelItem.parentId) {
            const parent = this.findParentForChild(update.view, update.novelItem);
            parent['children'].push(update.novelItem);
        } else {
            this._novelItems.get(update.view).push(update.novelItem);
        } 
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
    public novelsLoaded(novels: NovelModel[]): void {
        this._novels = novels;
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
    public tagsLoaded(tags: TagModel[]): void {
        this._novelItems.set(PARENT_ITEM_KEYS.TAGS, tags);
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
    public async deleteNovelItem(payload: { view: PARENT_ITEM_KEYS, novelItem: BaseModel }): Promise<void> {
        this._groupingNovelItemService.delete(payload.view, this._novelId, payload.novelItem).then(() => {
            this.novelItemDeleted({ view: payload.view, novelItem: payload.novelItem });
        });
    }

    @Action
    public async loadNovelItems(payload: { view: PARENT_ITEM_KEYS, novelId: number }): Promise<void> {
        this.isLoading(true);
        const { view, novelId } = payload;
        Promise.all([
            this._groupingNovelItemService.list( view, novelId),
            this._groupingNovelItemService.tags( view, novelId)
          ]).then(result => {
            this.novelItemsLoaded( { view: view, novelItems: result[0].data });
            this.tagsLoaded(result[1].data);
            this.isLoading(false);            
        });
    }  
    
    @Action
    public async moveParent(payload: { key: PARENT_ITEM_KEYS, 
        novelId: number, 
        parentId: number,
        oldPosition: number
        newPosition: number
        }): Promise<void> {
        const {key, novelId, parentId, oldPosition, newPosition} = payload;
        this._groupingNovelItemService.moveParent(key, novelId, parentId, oldPosition, newPosition).then((result) => {
            this.novelItemsLoaded({ view: key, novelItems: result.data}); // TODO do not reload everything, only the relevant parts
        });
    }    

    @Action
    public async moveChild(payload: { key: PARENT_ITEM_KEYS, 
        novelId: number, 
        childToMove: number,
        newParentId: number,
        newPosition: number
        }): Promise<void> {
        const {key, novelId, childToMove, newParentId, newPosition} = payload;
        this._groupingNovelItemService.moveChild(key, novelId, childToMove, newParentId, newPosition).then((result) => {
            this.novelItemsLoaded({ view: key, novelItems: result.data}); // TODO do not reload everything, only the relevant parts
        });      
    }
    
    
    private findParentIndex(view: PARENT_ITEM_KEYS, parent: BaseModel): number {
        return this._novelItems.get(view).findIndex(n => n.id === parent.id);
    }

    private findParentForChild(view: PARENT_ITEM_KEYS, child: BaseModel): BaseModel | undefined {
        return this._novelItems.get(view).find(parent => parent.id === child.parentId);
    }
}
