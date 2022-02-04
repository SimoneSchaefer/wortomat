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
        this._novelService.create(novel).then(result => {
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
            
            /* TODO: selectFirstItemIfNecessary(context, key, loadedItems) ;*/
          });
    }
}
