import { EXPORT_FORMAT } from '@/store/ExportSettingsModule';
import { AxiosResponse } from 'axios';
import { API } from './Axios';

export interface ExportOptions{
    type: EXPORT_FORMAT;
    includeSummary: boolean;
    includeExtendedSummary: boolean;
    includeContent: boolean;
    extraOptions?: Record<string,string>;
}

export class ExportService {
    export(novelId: number, exportOptions: ExportOptions): Promise<AxiosResponse> {
        return API.post(`/novels/${novelId}/export/`, { ...exportOptions })
    }
}