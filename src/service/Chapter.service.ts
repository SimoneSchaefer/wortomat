import axios from 'axios'

import { ChapterModel } from '@/models/Chapter.model';
import { NovelItemService } from './NovelItemService';
import { BACKEND_URL } from './Env';

export class ChapterService extends NovelItemService {
    list(novelId: number) {
        return axios.get(`${BACKEND_URL}/novels/${novelId}/chapters?_sort=order&_order=asc`)
    }
   
    update(chapter: ChapterModel) {
        return axios.put(`${BACKEND_URL}/chapters/${chapter.id}`, chapter)
    } 

    create(_novelId: number, chapter: ChapterModel) {
        return axios.post(`${BACKEND_URL}/chapters`, chapter)
    }

    delete(chapter: ChapterModel) {
        return axios.delete(`${BACKEND_URL}/chapters/${chapter.id}`)
    }
}