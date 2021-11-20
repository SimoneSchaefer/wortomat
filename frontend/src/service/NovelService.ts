import { NovelModel } from '@/models/Novel.model';
import { AxiosResponse } from 'axios';
import { API } from './Axios';

export class NovelService {

    getAll(): Promise<AxiosResponse> {
        return API.get(`/novels/`)
    }
    
    get(id: number): Promise<AxiosResponse> {
        return API.get(`/novels/${id}`)
    }
    
    update(novel: NovelModel): Promise<AxiosResponse> {
        return API.put(`/novels/`, novel)
    } 

    create(novel: NovelModel): Promise<AxiosResponse> {
        return API.post(`/novels/`, novel)
    }

    delete(novel: NovelModel): Promise<AxiosResponse> {
        return API.delete(`/novels/${novel.id}`)
    }
}