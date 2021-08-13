import axios from 'axios'

import { TagModel } from '@/models/Tag.model';
import { NovelItemService } from './NovelItemService';
import { BACKEND_URL } from './Env';

export class TagService extends NovelItemService {
    list(novelId: number) {
        return axios.get(`${BACKEND_URL}/${novelId}/tags`)
    }
   
    update(tag: TagModel) {
        return axios.put(`${BACKEND_URL}/tags/${tag.id}`, tag)
    } 

    create(_novelId: number, tag: TagModel) {
        return axios.post(`${BACKEND_URL}/tags`, tag)
    }

    delete(tag: TagModel) {
        return axios.delete(`${BACKEND_URL}/tags/${tag.id}`)
    }
}