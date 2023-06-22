package de.wortomat.service.export;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import java.io.IOException;

@Service
public class DocExportService implements Exporter {
    @Autowired
    HTMLExportService htmlExportService;

    @Autowired
    PandocService pandocService;

    @Override
    public void export(Long novelId, ExportOptions exportOptions, String filePath) throws IOException {
        this.pandocService.export(novelId, exportOptions, filePath, "docx");
    }

}
