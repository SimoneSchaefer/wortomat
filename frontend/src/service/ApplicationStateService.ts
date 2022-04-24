import { AxiosResponse } from 'axios';
import { API } from './Axios';

export class ApplicationStateService {

     public list(): Promise<AxiosResponse> {
        return API.get(`/application-state/`)
    }
   
}