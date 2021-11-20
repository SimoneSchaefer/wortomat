package de.wortomat.service.export;

import club.caliope.udc.DocumentConverter;
import club.caliope.udc.InputFormat;
import club.caliope.udc.OutputFormat;
import de.wortomat.model.NovelItem;
import de.wortomat.model.Part;
import de.wortomat.service.groupingNovelItem.PartService;
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


@Service
public class PDFLatexExportService implements Exporter {

    @Autowired
    PartService partService;

    @Value("classpath:export/pdflatex-template.tex")
    private Resource resource;

    @Autowired
    HTMLExportService htmlExportService;

    @Override
    public void export (Long novelId, ExportOptions exportOptions, String filePath ) throws IOException {
        String toExport = generateLatex(novelId, exportOptions);
        Files.write(Paths.get(filePath), toExport.getBytes(), StandardOpenOption.WRITE);
    }

    private String loadLatexTemplate() throws IOException {
        try (Reader reader = new InputStreamReader(resource.getInputStream(), StandardCharsets.UTF_8)) {
            return FileCopyUtils.copyToString(reader);
        } catch (IOException e) {
            throw new UncheckedIOException(e);
        }
    }

    private File createTmpChapterContentFile(NovelItem<Part> chapter) throws IOException {
        File chapterFile = File.createTempFile("wortomat", ".html");
        Files.write(Paths.get(chapterFile.getPath()), chapter.getContent().getBytes(StandardCharsets.UTF_8), StandardOpenOption.WRITE);
        // chapterFile.deleteOnExit();
        return chapterFile;
    }

    private String generateLatex(Long novelId, ExportOptions exportOptions) throws IOException {
        String html = htmlExportService.generateHTML(novelId, exportOptions);
        File chapterFile = File.createTempFile("wortomat", ".html");
        Files.write(Paths.get(chapterFile.getPath()), html.getBytes(StandardCharsets.UTF_8), StandardOpenOption.WRITE);
        File latexChapterFile = File.createTempFile("wortomat", ".tex");

        System.out.println("chapterFile: " + chapterFile.getPath() + "("+Files.exists(Path.of(chapterFile.getPath()))+")" + ", latex File: " + latexChapterFile.getPath() + "("+Files.exists(Path.of(latexChapterFile.getPath()))+")");

        /*ProcessBuilder processBuilder = new ProcessBuilder();
        processBuilder.command("/usr/bin/pandoc " + chapterFile.getPath() + " -f html -t latex -s -o " + latexChapterFile.getPath());
        Process process= processBuilder.start();*/

        // System.out.println("process..." + process.);

       /* try {
            int exitVal = process.waitFor();
            System.out.println("EXIT VAL IS " + exitVal);
        } catch (InterruptedException e) {
            throw new IOException(e);
        }*/
        // Path workDirectory = Files.createTempDirectory("wortomat");
        new DocumentConverter()

                .fromFile(chapterFile, InputFormat.HTML)
                .toFile(latexChapterFile, OutputFormat.LATEX)
                .addOption("-s")
                // .workingDirectory(new File(workDirectory.toUri())) // TODO
                .convert();

        return Files.readString(Path.of(latexChapterFile.getPath()));
        /*stringBuilder.append(loadLatexTemplate());

        List<Part> parts = this.partService.get(novelId);
        for (Part part : parts) {
            for (Chapter chapter : part.getChildren()) {
                File chapterFile = createTmpChapterContentFile(chapter);
                File latexChapterFile = File.createTempFile("wortomat", ".tex");

                System.out.println("chapterFile: " + chapterFile.getPath() + "("+Files.exists(Path.of(chapterFile.getPath()))+")" + ", latex File: " + latexChapterFile.getPath() + "("+Files.exists(Path.of(latexChapterFile.getPath()))+")");
                Path workDirectory = Files.createTempDirectory("wortomat");
                new DocumentConverter()
                        .fromFile(chapterFile, InputFormat.HTML)
                        .toFile(latexChapterFile, OutputFormat.LATEX)
                        // .workingDirectory(new File(workDirectory.toUri())) // TODO
                        .convert();
                stringBuilder.append(nullSafeLatexElement(true, chapter.getName(), "\\chapter{%s}\n"));
                // stringBuilder.append(nullSafeLatexElement(exportOptions.includeSummary, chapter.getExtended_summary(), "\\b{%s}"));
               // stringBuilder.append(nullSafeLatexElement(exportOptions.includeExtendedSummary, chapter.getExtended_summary(), "<div>%s</div>"));
                stringBuilder.append(nullSafeLatexElement(exportOptions.includeContent, Files.readString(latexChapterFile.toPath()), "%s\n"));
            }
        }
        stringBuilder.append("\\end{document}");
        return stringBuilder.toString();*/
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
