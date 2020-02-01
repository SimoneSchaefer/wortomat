import { Exporter } from "./Exporter";
import { ExportDataProvider } from "./ExportDataProvider";
import { SettingsProvider } from '../services/SettingsProvider'
import * as fs from 'fs';
import { Logger } from "../services/Logger";
import * as pandoc from 'pandoc'
import { HTMLExporter } from "./HTMLExporter";
const { exec } = require('child_process');

export class PDFLatexExporter implements Exporter {
    public export(settingsHandler: SettingsProvider, dataProvider: ExportDataProvider, options): Promise<string> {
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


                    const setupFilePath = settingsHandler.settings.exportpath + '/setup.tex';
                    fs.copyFileSync(global['__basedir'] + '/src/assets/templates/setup.tex', setupFilePath)
                    let setup = "" + fs.readFileSync(setupFilePath);
                    setup = setup.replace('PLACEHOLDERAUTHOR', options.author || '');
                    setup = setup.replace('PLACEHOLDERTITLE', options.title || '');
                    setup = setup.replace('PLACEHOLDERISBN', options.isbn || '');
                    setup = setup.replace('PLACEHOLDERPAGEHEIGHT', options.pageHeight || '8.5');
                    setup = setup.replace('PLACEHOLDERPAGEWIDTH', options.pageWidth || '5.675');
                    setup = setup.replace('PLACEHOLDERMARGININNER', options.marginOuter || '1.222');
                    setup = setup.replace('PLACEHOLDERMARGINOUTER', options.marginOuter || '0.611');
                    setup = setup.replace('PLACEHOLDERMARGINTOP', options.marginTop || '0.722');
                    setup = setup.replace('PLACEHOLDERMARGINBOTTOM', options.marginBottom || '1.545');
                    fs.writeFileSync(setupFilePath, setup);


                    var content = fs.readFileSync(fileNameLatex);
                    content = "\\include{setup}\n" + content + "\n\\end{document}"
                    content = content.replace(/\\section/g, '\\chapter');
                    content = content.replace(new RegExp('``', 'g'), '\\glqq ');
                    content = content.replace(new RegExp('\'\'', 'g'), '\\grqq  ');
                    fs.writeFileSync(fileNameLatex, content);

                    Logger.debug(`Converting file ${fileNameLatex}`);

                    exec(`pdflatex  -output-directory ${settingsHandler.settings.exportpath} ${fileNameLatex}`, (err2, stdout2, stderr2) => {
                        if (err2| stderr2) {  
                            reject(err2);
                        }
                        let fileEndingsToDelete = ['tex', 'html', 'log', 'aux', 'out'];
                        fileEndingsToDelete.forEach(end => fs.unlinkSync(fileNamePDF.replace('.pdf', `.${end}`)));
                        fs.unlinkSync(`${settingsHandler.settings.exportpath}/setup.tex`)
                        fs.unlinkSync(`${settingsHandler.settings.exportpath}/setup.aux`)
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