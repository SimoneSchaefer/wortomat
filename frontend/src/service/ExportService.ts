import { EXPORT_FORMAT } from '@/store/ExportSettingsModule';
import { PARENT_ITEM_KEYS } from '@/store/keys';
import { AxiosResponse } from 'axios';
import { API } from './Axios';

export interface ExportOptions{
    itemType: PARENT_ITEM_KEYS,
    format: EXPORT_FORMAT;
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