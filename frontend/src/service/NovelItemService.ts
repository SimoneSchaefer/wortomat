import { BaseModel } from '@/models/Base.model';
import { TagModel } from '@/models/Tag.model';
import { AxiosResponse } from 'axios';
import { API } from './Axios';
import { BACKEND_URL } from './Env';

export abstract class NovelItemService {

    abstract getAPIPath(parentId?: number): string;

    public getBasePath(novelId: number): string {
        return `${BACKEND_URL}/novels/${novelId}/${this.getAPIPath()}`;
    }

    public tags(novelId: number): Promise<AxiosResponse> {
        return API.get(`/novels/${novelId}/${this.getAPIPath()}/tags`)
    }

    public createTag(novelId: number, tag: TagModel): Promise<AxiosResponse> {
        return API.post(`/novels/${novelId}/${this.getAPIPath()}/tags`, tag)
    }

    public updatePositions(novelId: number, newOrder: BaseModel[]): Promise<AxiosResponse>{
        const sortedIds = newOrder.map(item => item.id);
        return API.put(`novels/${novelId}/${this.getAPIPath()}/updatePositions`, sortedIds)
    }

    public list(novelId: number): Promise<AxiosResponse> {
        return API.get(`/novels/${novelId}/${this.getAPIPath()}/`)
    }
   
    public update(novelId: number, item: BaseModel): Promise<AxiosResponse> {
        return API.put(`/novels/${novelId}/${this.getAPIPath(item.parentId)}/`, item)
    } 

    public create(novelId: number, item: BaseModel, parentId?: number): Promise<AxiosResponse> {
        return API.post(`/novels/${novelId}/${this.getAPIPath(parentId)}/`, item)
    }

    public delete(novelId: number, item: BaseModel): Promise<AxiosResponse> {
        return API.delete(`/novels/${novelId}/${this.getAPIPath()}/${item.id}`)
    }

    deleteImage(novelId: number, itemId: number, fileId: number) {
        return API.delete(`${this.getBasePath(novelId)}/${itemId}/files/${fileId}`);
    }

    getUploadUrl(novelId: number, itemId: number) {
        return `${this.getBasePath(novelId)}/${itemId}/upload`;
    }

    getImageUrl(novelId: number, itemId: number, fileId: number) {
        return `${this.getBasePath(novelId)}/${itemId}/files/${fileId}`;
    }
}