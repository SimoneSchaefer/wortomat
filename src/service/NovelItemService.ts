import { BaseModel } from '@/models/Base.model';
import { AxiosResponse } from 'axios';

export abstract class NovelItemService {
    readonly BACKEND_URL = 'http://localhost:3000';
    
    abstract update(item: BaseModel): Promise<AxiosResponse>;
    abstract create(novelId: number, item: BaseModel): Promise<AxiosResponse>;
    abstract delete(item: BaseModel): Promise<AxiosResponse>
}