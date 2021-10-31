package de.wortomat.export;

import de.wortomat.service.StorageConfigService;
import de.wortomat.service.export.ExportOptions;
import de.wortomat.service.export.ExportOptionsType;
import de.wortomat.service.export.PDFExportService;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;

import java.io.IOException;

@SpringBootTest
public class PDFExporterTest {
    @Autowired
    StorageConfigService fileService;
    @Autowired
    PDFExportService pdfExportService;

    // @Test
    public void test() throws IOException {
        ExportOptions exportOptions = new ExportOptions();
        exportOptions.includeSummary = true;
        exportOptions.includeContent = true;
        exportOptions.includeExtendedSummary = true;
        pdfExportService.export(1L, exportOptions, fileService.getExportFile(ExportOptionsType.PDF));


    }

}
