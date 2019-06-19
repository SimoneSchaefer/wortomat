import { Exporter } from "./Exporter";
import { ExportDataProvider } from "./ExportDataProvider";
import { SettingsProvider } from '../services/SettingsProvider'
import * as fs from 'fs';
import { Logger } from "../services/Logger";
import * as pandoc from 'pandoc'
import { HTMLExporter } from "./HTMLExporter";
const { exec } = require('child_process');

export class PDFLatexExporter implements Exporter {
    public export(settingsHandler: SettingsProvider, dataProvider: ExportDataProvider): Promise<string> {
        return new Promise<string>(function (resolve, reject) {

            let htmlExport = new HTMLExporter();
            htmlExport.export(settingsHandler, dataProvider)
            .then(function (fileNameHTML) {
                let fileNameLatex = fileNameHTML.replace('html', 'tex');
                let fileNamePDF = fileNameHTML.replace('html', 'pdf');         

                exec(`pandoc -f html -t latex -o ${fileNameLatex} ${fileNameHTML}`,  (err, stdout, stderr) => {
                    if (err) {
                        Logger.error(stderr);
                        Logger.error(stdout);
                        reject(err);
                    }

                    //replacements: section -> chapter, end document, include setup
                    var fs = require('fs')
                    var path = require('path')
                    var content = fs.readFileSync(fileNameLatex);
                    content = "\\include{setup}\n" + content + "\n\\end{document}"
                    content = content.replace(/\\section/g, '\\chapter');

                    fs.writeFileSync(fileNameLatex, content);

                    Logger.debug(`Converting file ${fileNameLatex}`);

                    exec(`pdflatex  -output-directory ${settingsHandler.settings.exportpath} ${fileNameLatex}`, (err2, stdout2, stderr2) => {
                        if (err2| stderr2) {  
                            reject(err2);
                        }
                        let fileEndingsToDelete = ['tex', 'html', 'log', 'aux', 'out'];
                        fileEndingsToDelete.forEach(end => fs.unlinkSync(fileNamePDF.replace('.pdf', `.${end}`)));
                        resolve(fileNamePDF);
                    });         
                });
            })
            .catch(function (err) {
                reject(`An error occured: ${err}`);
            });         
        });
    }
}