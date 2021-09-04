package de.wortomat.service;

import de.wortomat.service.export.ExportOptionsType;
import org.springframework.stereotype.Service;

import java.io.IOException;
import java.nio.file.Files;
import java.nio.file.Paths;
import java.text.SimpleDateFormat;
import java.util.Date;

@Service
public class StorageConfigService {
    private final String HOME_FOLDER = System.getProperty("user.home");
    private final String STORAGE_FOLDER = String.format("%s/%s", HOME_FOLDER, "wortomat");
    private final String EXPORT_FOLDER = String.format("%s/%s", STORAGE_FOLDER, "exports");
    private final String UPLOAD_FOLDER = String.format("%s/%s", STORAGE_FOLDER, "uploads");

    public String getStorageLocation() throws IOException {
        return getOrCreate(HOME_FOLDER);
    }

    public String getUploadFolder() throws IOException {
        return getOrCreate(UPLOAD_FOLDER);
    }

    public String getUploadFolder(Long id) throws IOException {
        return getOrCreate(String.format("%s/%d", getUploadFolder(), id));
    }

    public String getExportFolder() throws IOException {
        return getOrCreate(EXPORT_FOLDER);
    }

    public String getExportFile(ExportOptionsType type) throws IOException {
        SimpleDateFormat format = new SimpleDateFormat("yyyy-MM-dd-hh:mm:ss");
        String filePath = String.format("%s/%s.%s", getExportFolder(), format.format(new Date()), type);
        Files.createFile(Paths.get(filePath));
        return filePath;
    }

    private String getOrCreate(String folderPath) throws IOException {
        if (!Files.exists(Paths.get(folderPath))) {
            Files.createDirectories(Paths.get(folderPath));
        }
        return folderPath;
    }
}
