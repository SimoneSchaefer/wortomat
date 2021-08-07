import axios from 'axios'

import { ChapterModel } from '@/models/Chapter.model';
import { NovelItemService } from './NovelItemService';

export class ChapterService extends NovelItemService {
    readonly BACKEND_URL = 'http://localhost:3000';
    
    update(chapter: ChapterModel) {
        return axios.put(`${this.BACKEND_URL}/chapters/${chapter.id}`, chapter)
    } 

    create(_novelId: number, chapter: ChapterModel) {
        return axios.post(`${this.BACKEND_URL}/chapters`, chapter)
    }

    delete(chapter: ChapterModel) {
        return axios.delete(`${this.BACKEND_URL}/chapters/${chapter.id}`)
    }
}