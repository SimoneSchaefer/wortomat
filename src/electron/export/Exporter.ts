import {ExportDataProvider} from './ExportDataProvider'
import {SettingsProvider} from '../services/SettingsProvider'

export interface Exporter {
    export (settingsHandler: SettingsProvider, exportDataProvider : ExportDataProvider, options: any) : Promise<string>;
}