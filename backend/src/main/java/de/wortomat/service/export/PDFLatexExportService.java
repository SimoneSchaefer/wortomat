package de.wortomat.service.export;

import club.caliope.udc.DocumentConverter;
import club.caliope.udc.InputFormat;
import club.caliope.udc.OutputFormat;
import de.wortomat.model.NovelItem;
import de.wortomat.model.Part;
import de.wortomat.service.StorageConfigService;
import de.wortomat.service.groupingNovelItem.PartService;
import org.apache.commons.io.FileUtils;
import org.apache.commons.io.IOUtils;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.core.io.Resource;
import org.springframework.stereotype.Service;
import org.springframework.util.FileCopyUtils;

import java.io.*;
import java.nio.charset.StandardCharsets;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.Paths;
import java.nio.file.StandardOpenOption;
import java.util.Date;


@Service
public class PDFLatexExportService implements Exporter {

    @Autowired
    PartService partService;

    @Autowired
    StorageConfigService storageService;

    @Value("classpath:export/template.tex")
    private Resource template;
    @Value("classpath:export/sidecap.sty")
    private Resource sidecap;
    @Value("classpath:export/siunitx.sty")
    private Resource units;

    @Autowired
    HTMLExportService htmlExportService;

    @Override
    public void export (Long novelId, ExportOptions exportOptions, String filePath ) throws IOException {
        String workDirectory = storageService.getExportFolder() + "/tmp-"+ new Date().getTime() + "/";
        Files.createDirectory(Paths.get(workDirectory));

        loadLatexTemplate(workDirectory);
        loadLatexLibraries(workDirectory);

        String toExport = generateLatex(novelId, exportOptions, filePath, workDirectory);
        compilePDF(toExport, filePath, workDirectory);
        FileUtils.deleteDirectory(new File(workDirectory));
    }

    private void loadLatexTemplate(String workingDirectory) {
        copyResourceToWorkingDirectory(template, workingDirectory);
    }

    private void loadLatexLibraries(String workingDirectory) {
        copyResourceToWorkingDirectory(sidecap, workingDirectory);
        copyResourceToWorkingDirectory(units, workingDirectory);
    }

    private void copyResourceToWorkingDirectory(Resource resource, String workingDirectory) {
        try (Reader reader = new InputStreamReader(resource.getInputStream(), StandardCharsets.UTF_8)) {
            String templateContent = FileCopyUtils.copyToString(reader);
            Path templatePath = Paths.get(workingDirectory, resource.getFilename()).toAbsolutePath();
            Files.createFile(templatePath);
            Files.write(templatePath.toAbsolutePath(), templateContent.getBytes(StandardCharsets.UTF_8));
        } catch (IOException e) {
            throw new UncheckedIOException(e);
        }
    }

    private void compilePDF(String latexFilePath, String exportPath, String workDirectory) throws IOException {
        ProcessBuilder processBuilder = new ProcessBuilder().directory(new File(workDirectory));
        processBuilder.command("pdflatex", latexFilePath);
        Process process= processBuilder.start();
        String output = IOUtils.toString(process.getInputStream(), StandardCharsets.UTF_8);

        processBuilder.inheritIO();
        String output2 = IOUtils.toString(process.getInputStream(), StandardCharsets.UTF_8);


        try {
            int exitVal = process.waitFor();
            System.out.println("output:::" + output);
            System.out.println("output2:::" + output2);
            System.out.println("EXIT VAL IS " + exitVal + ", copying from "+ latexFilePath.replace(".tex", ".pdf") + " to " + exportPath);
            Files.deleteIfExists(Paths.get(exportPath));
            String expectedPdfFileName = Paths.get(exportPath).getFileName().toString();
            // FileUtils.copyFile(new File(workDirectory, "output.pdf"), new File(workDirectory, expectedPdfFileName));
            FileUtils.copyFileToDirectory(new File(workDirectory, expectedPdfFileName), new File(storageService.getExportFolder()));
        } catch (InterruptedException e) {
            throw new IOException(e);
        }
    }

    private String generateLatex(Long novelId, ExportOptions exportOptions, String exportFilePath, String workDirectory) throws IOException {

        String htmlFile = "input.html";
        String latexFile = Paths.get(exportFilePath).getFileName().toString().replace(".pdf", ".latex");

        String html = htmlExportService.generateHTML(novelId, exportOptions);
        Files.createFile(Paths.get(workDirectory + htmlFile));
        Files.write(Paths.get(workDirectory + htmlFile), html.getBytes(StandardCharsets.UTF_8), StandardOpenOption.WRITE);


        ProcessBuilder processBuilder = new ProcessBuilder().directory(new File(workDirectory));
        processBuilder.inheritIO();

        System.out.println("WTF::::" + workDirectory+"template.tex");
        processBuilder.command("pandoc", "--template=template.tex", "--top-level-division=chapter", htmlFile, "-f", "html", "-t", "latex", "-o", latexFile);
        // processBuilder.command("pandoc", htmlFile, "-f", "html", "-t", "latex", "-s", "-o", latexFile);
         Process process= processBuilder.start();
        String output = IOUtils.toString(process.getInputStream(), StandardCharsets.UTF_8);
        try {
            int exitVal = process.waitFor();
            System.out.println("EXIT VAL IS " + exitVal + ", outout: " + output);
        } catch (InterruptedException e) {
            throw new IOException(e);
        }
        return latexFile;
    }

    private String nullSafeLatexElement(boolean include, String contentItem, String format) {
        if (!include) {
            return "";
        }
        if (contentItem == null) {
            return "";
        }
        return String.format(format, contentItem);
    }
}
