package de.wortomat.service;

import de.wortomat.model.Chapter;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import java.io.IOException;
import java.nio.file.Files;
import java.nio.file.Paths;
import java.nio.file.StandardOpenOption;
import java.util.List;

@Service
public class ExportService {

    @Autowired
    FileService fileService;

    @Autowired
    ChapterService chapterService;

    public String export(Long novelId, boolean includeSummary, boolean includeExtendedSummary, boolean includeContent) throws IOException {
        String filePath = fileService.getExportFile();
        List<Chapter> chapters = this.chapterService.get(novelId);
        for (Chapter chapter : chapters) {
            StringBuilder stringBuilder = new StringBuilder();
            stringBuilder.append(nullSafeHtmlElement(true, chapter.getTitle(), "<h1>%s</h1>"));
            stringBuilder.append(nullSafeHtmlElement(includeSummary, chapter.getExtended_summary(), "<div><b>%s</b></div>"));
            stringBuilder.append(nullSafeHtmlElement(includeExtendedSummary, chapter.getExtended_summary(), "<div>%s</div>"));
            stringBuilder.append(nullSafeHtmlElement(includeContent, chapter.getContent(), "<div>%s</div>"));
            Files.write(Paths.get(filePath), stringBuilder.toString().getBytes(), StandardOpenOption.APPEND);
        };
        return filePath;
    }

    private String nullSafeHtmlElement(boolean include, String contentItem, String format) {
        if (!include) {
            return "";
        }
        if (contentItem == null) {
            return "";
        }
        return String.format(format, contentItem);
    }
}
