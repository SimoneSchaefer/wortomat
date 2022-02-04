import { BaseModel } from '@/models/Base.model';
import { TagModel } from '@/models/Tag.model';
import { childKeyForParentKey, PARENT_ITEM_KEYS } from '@/store/keys';
import { AxiosResponse } from 'axios';
import { API } from './Axios';
import { BACKEND_URL } from './Env';

export class GroupingNovelItemService {
    getAPIPath(view: PARENT_ITEM_KEYS, parentId?: number): string {
        const apiPathParts = [view.toLocaleLowerCase()];
        if (parentId) {
            apiPathParts.push(`${parentId}`);
            apiPathParts.push(childKeyForParentKey(view).toLocaleLowerCase());
        }
        return apiPathParts.join('/');
    }

    public getBasePath(view: PARENT_ITEM_KEYS, novelId: number): string {
        return `${BACKEND_URL}/novels/${novelId}/${this.getAPIPath(view)}`;
    }

    public tags(view: PARENT_ITEM_KEYS, novelId: number): Promise<AxiosResponse> {
        return API.get(`/novels/${novelId}/${this.getAPIPath(view)}/tags`)
    }

    public createTag(view: PARENT_ITEM_KEYS, novelId: number, tag: TagModel): Promise<AxiosResponse> {
        return API.post(`/novels/${novelId}/${this.getAPIPath(view)}/tags`, tag)
    }

    public updatePositions(view: PARENT_ITEM_KEYS, novelId: number, newOrder: BaseModel[]): Promise<AxiosResponse>{
        const sortedIds = newOrder.map(item => item.id);
        return API.put(`novels/${novelId}/${this.getAPIPath(view)}/updatePositions`, sortedIds)
    }

    public moveChild(view: PARENT_ITEM_KEYS, novelId: number, childId: number, newParentId: number, newPosition: number): Promise<AxiosResponse>{
        return API.put(`novels/${novelId}/${this.getAPIPath(view)}/moveChild/`, {
            childId: childId,
            newParentId: newParentId,
            newPosition: newPosition
        })
    }

    public moveParent(view: PARENT_ITEM_KEYS, novelId: number, parentId: number, oldPosition: number, newPosition: number): Promise<AxiosResponse>{
        return API.put(`novels/${novelId}/${this.getAPIPath(view)}/moveParent/`, {
            parentId: parentId,
            oldPosition: oldPosition,
            newPosition: newPosition
        })
    }

    public list(view: PARENT_ITEM_KEYS, novelId: number): Promise<AxiosResponse> {
        return API.get(`/novels/${novelId}/${this.getAPIPath(view)}/`)
    }
   
    public update(view: PARENT_ITEM_KEYS, novelId: number, item: BaseModel): Promise<AxiosResponse> {
        const parentId = item.parentId;
        delete item['parentId'];
        return API.put(`/novels/${novelId}/${this.getAPIPath(view, parentId)}/`, item)
    } 

    public create(view: PARENT_ITEM_KEYS, novelId: number, item: BaseModel, parentId?: number): Promise<AxiosResponse> {
        return API.post(`/novels/${novelId}/${this.getAPIPath(view, parentId)}/`, item)
    }

    public delete(view: PARENT_ITEM_KEYS, novelId: number, item: BaseModel): Promise<AxiosResponse> {
        return API.delete(`/novels/${novelId}/${this.getAPIPath(view, item.parentId)}/${item.id}`)
    }

    deleteImage(view: PARENT_ITEM_KEYS, novelId: number, parentId: number, itemId: number, fileId: number) {
        return API.delete(`${BACKEND_URL}/novels/${novelId}/${this.getAPIPath(view, parentId)}/${itemId}/files/${fileId}`);
    }

    getUploadUrl(view: PARENT_ITEM_KEYS, novelId: number, parentId: number, itemId: number) {
        return `${BACKEND_URL}/novels/${novelId}/${this.getAPIPath(view, parentId)}/${itemId}/files/upload`;
    }

    getImageUrl(view: PARENT_ITEM_KEYS, novelId: number, parentId: number, itemId: number, fileId: number) {
        return `${BACKEND_URL}/novels/${novelId}/${this.getAPIPath(view, parentId)}/${itemId}/files/${fileId}`;
    }
}