import { AxiosResponse } from 'axios';
import { API } from './Axios';

export class SettingsService {

    getAll(): Promise<AxiosResponse> {
        return API.get(`/settings/`)
    }
    
   
}