import { NovelModel } from "@/models/Novel.model";
import { NovelService } from "@/service/NovelService";
import { VuexModule, Module, Mutation, Action } from "vuex-class-modules";

@Module({ generateMutationSetters: true })
export default class NovelModule extends VuexModule {
    private _novelService = new NovelService(); 
    private _novelId: number = undefined;
    private _novels = [];

    @Mutation
    public novelOpened(novelId: number) {
        this._novelId = novelId;
    }

    @Mutation
    public novelAdded(novel: NovelModel) {
        this._novels.push(novel);
    }

    @Mutation
    public novelDeleted(novel: NovelModel) {
        const index = this._novels.findIndex(n => n.id === novel.id);
        if (index > -1) this._novels.splice(index, 1);
    }

    @Mutation
    public novelUpdated(novel: NovelModel) {
        const index = this._novels.findIndex(n => n.id === novel.id);
        if (index > -1) this._novels.splice(index, 1, novel);    
    }

    @Mutation
    public novelsLoaded(novels: NovelModel[]) {
        this._novels = novels;
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
        this._novelService.delete(novel).then(result => {
            this.novelDeleted(result.data);
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
}
