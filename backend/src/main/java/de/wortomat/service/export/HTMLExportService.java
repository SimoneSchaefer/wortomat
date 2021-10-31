package de.wortomat.service.export;

import de.wortomat.model.Chapter;
import de.wortomat.service.ChapterService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import java.io.IOException;
import java.nio.file.Files;
import java.nio.file.Paths;
import java.nio.file.StandardOpenOption;
import java.util.List;

@Service
public class HTMLExportService implements Exporter {

    @Autowired
    ChapterService chapterService;

    @Override
    public void export (Long novelId, ExportOptions exportOptions, String filePath ) throws IOException {
        String toExport = generateHTML(novelId, exportOptions);
        Files.write(Paths.get(filePath), toExport.getBytes(), StandardOpenOption.WRITE);
    }

    public String generateHTML(Long novelId, ExportOptions exportOptions) {
        StringBuilder stringBuilder = new StringBuilder();
        /*List<Chapter> chapters = this.chapterService.get(novelId);

        for (Chapter chapter : chapters) {
            stringBuilder.append(nullSafeHtmlElement(true, chapter.getName(), "<h1>%s</h1>"));
            stringBuilder.append(nullSafeHtmlElement(exportOptions.includeSummary, chapter.getExtended_summary(), "<div><b>%s</b></div>"));
            stringBuilder.append(nullSafeHtmlElement(exportOptions.includeExtendedSummary, chapter.getExtended_summary(), "<div>%s</div>"));
            stringBuilder.append(nullSafeHtmlElement(exportOptions.includeContent, chapter.getContent(), "<div>%s</div>"));
        }*/
        return stringBuilder.toString();
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
