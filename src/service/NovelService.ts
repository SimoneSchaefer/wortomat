import Novel from '@/models/Novel.model';
import axios from 'axios'

export class NovelService {
    readonly BACKEND_URL = 'http://localhost:3000';

    loadNovels() {
        return axios.get(`${this.BACKEND_URL}/novels`)
    }
    
    update(novel: Novel) {
        return axios.put(`${this.BACKEND_URL}/novels/${novel.id}`, novel)
    } 

    create(novel: Novel) {
        return axios.post(`${this.BACKEND_URL}/novels`, novel)
    }

    delete(novel: Novel) {
        return axios.delete(`${this.BACKEND_URL}/novels/${novel.id}`)
    }
}