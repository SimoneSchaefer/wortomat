import { AxiosResponse } from 'axios';
import { API } from './Axios';

export enum ExportType {
    HTML = "HTML",
    PDF = "PDF",
    PDF_LATEX = "PDF_LATEX",
    DOC = "DOC"
}

export interface ExportOptions{
    type: ExportType;
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