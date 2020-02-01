import { Exporter } from "./Exporter";
import { ExportDataProvider } from "./ExportDataProvider";
import { SettingsProvider } from '../services/SettingsProvider'
import * as fs from 'fs';

export class HTMLExporter implements Exporter {
    public export(settingsHandler: SettingsProvider, dataProvider: ExportDataProvider, options = {}): Promise<string> {
        return new Promise<string>(function (resolve, reject) {
            let filePath = settingsHandler.generateNewExportFilePath("html");
            dataProvider.collectData()
            .then(content => fs.writeFile(filePath, content, function (err) {
                if (err) {
                    reject(err);
                }
                resolve(filePath);
            }));
        });
    }
}