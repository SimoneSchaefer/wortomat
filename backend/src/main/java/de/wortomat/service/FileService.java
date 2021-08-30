package de.wortomat.service;

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

    public String getExportFile() throws IOException {
        SimpleDateFormat format = new SimpleDateFormat("yyyy-MM-dd-hh:mm:ss");
        String filePath = String.format("%s%s.html", getStorageLocation(), format.format(new Date()));
        Files.createFile(Paths.get(filePath));
        return filePath;
    }
}
