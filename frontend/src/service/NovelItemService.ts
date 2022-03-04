import { BaseModel } from '@/models/Base.model';
import { TagModel } from '@/models/Tag.model';
import { AxiosResponse } from 'axios';
import { API } from './Axios';
import { BACKEND_URL } from './Env';


/** @deprecated */
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

    public moveChild(novelId: number, childId: number, newParentId: number, newPosition: number): Promise<AxiosResponse>{
        return API.put(`novels/${novelId}/${this.getAPIPath()}/moveChild/`, {
            childId: childId,
            newParentId: newParentId,
            newPosition: newPosition
        })
    }

    public moveParent(novelId: number, parentId: number, oldPosition: number, newPosition: number): Promise<AxiosResponse>{
        return API.put(`novels/${novelId}/${this.getAPIPath()}/moveParent/`, {
            parentId: parentId,
            oldPosition: oldPosition,
            newPosition: newPosition
        })
    }

    public list(novelId: number): Promise<AxiosResponse> {
        return API.get(`/novels/${novelId}/${this.getAPIPath()}/`)
    }
   
    public update(novelId: number, item: BaseModel): Promise<AxiosResponse> {
        const parentId = item.parentId;
        delete item['parentId'];
        return API.put(`/novels/${novelId}/${this.getAPIPath(parentId)}/`, item)
    } 

    public create(novelId: number, item: BaseModel, parentId?: number): Promise<AxiosResponse> {
        return API.post(`/novels/${novelId}/${this.getAPIPath(parentId)}/`, item)
    }

    public delete(novelId: number, item: BaseModel): Promise<AxiosResponse> {
        return API.delete(`/novels/${novelId}/${this.getAPIPath(item.parentId)}/${item.id}`)
    }


    deleteImage(novelId: number, parentId: number, itemId: number, fileId: number) {
        return API.delete(`${BACKEND_URL}/novels/${novelId}/${this.getAPIPath(parentId)}/${itemId}/files/${fileId}`);
    }

    getUploadUrl(novelId: number, parentId: number, itemId: number) {
        return `${BACKEND_URL}/novels/${novelId}/${this.getAPIPath(parentId)}/${itemId}/files/upload`;
    }

    getImageUrl(novelId: number, parentId: number, itemId: number, fileId: number) {
        return `${BACKEND_URL}/novels/${novelId}/${this.getAPIPath(parentId)}/${itemId}/files/${fileId}`;
    }
}