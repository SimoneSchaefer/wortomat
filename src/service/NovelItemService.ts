import { BaseModel } from '@/models/Base.model';
import { AxiosResponse } from 'axios';
import { API } from './Axios';

export abstract class NovelItemService {

    abstract getAPIPath();

    public updatePositions(novelId: number, newOrder: BaseModel[]): Promise<AxiosResponse>{
        const sortedIds = newOrder.map(item => item.id);
        return API.put(`novels/${novelId}/${this.getAPIPath()}/updatePositions`, sortedIds)
    }

    public list(novelId: number): Promise<AxiosResponse> {
        return API.get(`/novels/${novelId}/${this.getAPIPath()}/`)
    }
   
    public update(novelId: number, item: BaseModel): Promise<AxiosResponse> {
        return API.put(`/novels/${novelId}/${this.getAPIPath()}/`, item)
    } 

    public create(novelId: number, item: BaseModel): Promise<AxiosResponse> {
        return API.post(`/novels/${novelId}/${this.getAPIPath()}/`, item)
    }

    public delete(novelId: number, item: BaseModel): Promise<AxiosResponse> {
        return API.delete(`/novels/${novelId}/${this.getAPIPath()}/${item.id}`)
    }
}