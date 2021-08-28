import { NovelModel } from '@/models/Novel.model';
import axios from 'axios'
import { API } from './Axios';
import { BACKEND_URL } from './Env';

export class NovelService {

    getAll() {
        return API.get(`/novels/`)
    }
    
    get(id: number) {
        return API.get(`/novels/${id}?_embed=tags&_sort=order&_order=asc`)
    }
    
    update(novel: NovelModel) {
        return API.put(`/novels/`, novel)
    } 

    create(novel: NovelModel) {
        return API.post(`/novels/`, novel)
    }

    delete(novel: NovelModel) {
        return API.delete(`/novels/${novel.id}`)
    }
}