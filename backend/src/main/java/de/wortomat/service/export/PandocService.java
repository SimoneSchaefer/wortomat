package de.wortomat.service.export;

import de.wortomat.service.StorageConfigService;
import org.apache.commons.io.FileUtils;
import org.apache.commons.io.IOUtils;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import java.io.File;
import java.io.IOException;
import java.nio.charset.StandardCharsets;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.Paths;
import java.nio.file.StandardOpenOption;
import java.util.Date;

@Service
public class PandocService {
    @Autowired
    HTMLExportService htmlExportService;

    @Autowired
    StorageConfigService storageConfigService;

    public void export(Long novelId, ExportOptions exportOptions, String filePath, String targetFormat) throws IOException {
        String workDirectory = storageConfigService.getExportFolder() + "/tmp-" + new Date().getTime() + "/";
        Files.createDirectory(Paths.get(workDirectory));

        String toExport = this.htmlExportService.generateHTML(novelId, exportOptions);
        Path htmlPath = Paths.get(workDirectory + "input.html");
        Files.createFile(htmlPath);
        Files.write(htmlPath, toExport.getBytes(StandardCharsets.UTF_8), StandardOpenOption.WRITE);
        this.runPandoc(htmlPath.toString(), filePath, targetFormat);
        Files.write(Paths.get(filePath), toExport.getBytes(), StandardOpenOption.WRITE);
        FileUtils.deleteDirectory(new File(workDirectory));

    }


    private void runPandoc(String inputFilePath, String outFilePath, String targetFormat) throws IOException {
        ProcessBuilder processBuilder = new ProcessBuilder();
        processBuilder.inheritIO();

        processBuilder.command("pandoc", inputFilePath, "-f", "html", "-t", targetFormat, "-s", "-o", outFilePath);
        // processBuilder.command("pandoc", htmlFile, "-f", "html", "-t", "latex", "-s", "-o", latexFile);

        Process process = processBuilder.start();
        String output = IOUtils.toString(process.getInputStream(), StandardCharsets.UTF_8);
        int exitVal = 0;
        try {
            exitVal = process.waitFor();
        } catch (InterruptedException e) {
            throw new IOException(e);
        }
        System.out.println("EXIT VAL IS " + exitVal + ", output: " + output);
    }

    public boolean isPandocInstalled() {
        ProcessBuilder processBuilder = new ProcessBuilder();
        processBuilder.inheritIO();
        processBuilder.command("pandoc", "--help");
        try {
            Process process = processBuilder.start();
            String output = IOUtils.toString(process.getInputStream(), StandardCharsets.UTF_8);
            int exitVal = process.waitFor();
            System.out.println("EXIT VAL IS " + exitVal + ", outout: " + output);
        } catch (Exception e) {
            return false;
        }
        return true;
    }
}
