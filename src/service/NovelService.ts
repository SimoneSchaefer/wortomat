import { NovelModel } from '@/models/Novel.model';
import axios from 'axios'

export class NovelService {
    readonly BACKEND_URL = 'http://localhost:3000';

    getAll() {
        return axios.get(`${this.BACKEND_URL}/novels`)
    }
    
    get(id: number) {
        return axios.get(`${this.BACKEND_URL}/novels/${id}?_embed=chapters&_sort=views&_order=asc`)
    }
    
    update(novel: NovelModel) {
        return axios.put(`${this.BACKEND_URL}/novels/${novel.id}`, novel)
    } 

    create(novel: NovelModel) {
        return axios.post(`${this.BACKEND_URL}/novels`, novel)
    }

    delete(novel: NovelModel) {
        return axios.delete(`${this.BACKEND_URL}/novels/${novel.id}`)
    }
}