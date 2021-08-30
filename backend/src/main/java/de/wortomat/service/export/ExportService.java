package de.wortomat.service.export;

import de.wortomat.service.FileService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import java.io.IOException;

@Service
public class ExportService {
    @Autowired
    FileService fileService;

    @Autowired
    HTMLExportService htmlExportService;

    public String export(Long novelId, ExportOptions exportOptions) throws IOException {
        ExportOptionsType type = exportOptions.type;
        String filePath = fileService.getExportFile(type);
        Exporter exporter = getExporter(type);
        exporter.export(novelId, exportOptions, filePath);
        return filePath;
    }

    private Exporter getExporter(ExportOptionsType type) {
        switch (type) {
            case HTML: return this.htmlExportService;

        }
        throw new IllegalArgumentException(String.format("unknown export format %s", type));
    }
}
