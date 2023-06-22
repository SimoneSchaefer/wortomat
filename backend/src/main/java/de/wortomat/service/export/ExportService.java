package de.wortomat.service.export;

import de.wortomat.service.StorageConfigService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import java.io.IOException;

@Service
public class ExportService {
    @Autowired
    StorageConfigService fileService;
    @Autowired
    HTMLExportService htmlExportService;
    @Autowired
    PDFExportService pdfExportService;
    @Autowired
    PDFLatexExportService pdfLatexExportService;
    @Autowired
    DocExportService docExportService;

    public String export(Long novelId, ExportOptions exportOptions) throws IOException {
        ExportOptionsFormat type = exportOptions.format;
        String filePath = fileService.getExportFile(type);
        Exporter exporter = getExporter(type);
        exporter.export(novelId, exportOptions, filePath);
        return filePath;
    }

    private Exporter getExporter(ExportOptionsFormat type) {
        switch (type) {
            case HTML:
                return this.htmlExportService;
            case PDF:
                return this.pdfExportService;
            case PDF_LATEX:
                return this.pdfLatexExportService;
            case WORD:
                return this.docExportService;
        }
        throw new IllegalArgumentException(String.format("unknown export format %s", type));
    }
}
