package de.wortomat.service;

import de.wortomat.service.export.ExportOptions;
import de.wortomat.service.export.ExportOptionsType;
import de.wortomat.service.export.ExportService;
import org.springframework.stereotype.Service;

import java.io.IOException;
import java.nio.file.Files;
import java.nio.file.Paths;
import java.text.SimpleDateFormat;
import java.util.Date;

@Service
public class FileService {
    public String getStorageLocation() {
        return System.getProperty("user.home") + "/wortomat/";
    }

    public String getExportFile(ExportOptionsType type) throws IOException {
        SimpleDateFormat format = new SimpleDateFormat("yyyy-MM-dd-hh:mm:ss");
        String filePath = String.format("%s%s.%s", getStorageLocation(), format.format(new Date()), type);
        Files.createFile(Paths.get(filePath));
        return filePath;
    }
}
