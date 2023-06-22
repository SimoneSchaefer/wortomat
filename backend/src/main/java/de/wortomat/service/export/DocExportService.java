package de.wortomat.service.export;

import de.wortomat.model.GroupingNovelItem;
import de.wortomat.model.NovelItem;
import de.wortomat.service.groupingNovelItem.*;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import java.io.IOException;
import java.nio.file.Files;
import java.nio.file.Paths;
import java.nio.file.StandardOpenOption;
import java.util.List;

@Service
public class DocExportService implements Exporter {

    @Autowired
    PartService partService;
    @Autowired
    CharacterGroupService characterGroupService;
    @Autowired
    LocationGroupService locationGroupService;
    @Autowired
    ResearchGroupService researchGroupService;

    @Override
    public void export (Long novelId, ExportOptions exportOptions, String filePath ) throws IOException {
        String toExport = generateHTML(novelId, exportOptions);
        Files.write(Paths.get(filePath), toExport.getBytes(), StandardOpenOption.WRITE);
    }

    public String generateHTML(Long novelId, ExportOptions exportOptions) {
        StringBuilder stringBuilder = new StringBuilder();
        List<GroupingNovelItem> parts = this.serviceToUse(exportOptions).get(novelId);
        for (GroupingNovelItem part : parts) {
            for (Object chapter : part.getChildren()) {
                NovelItem child = (NovelItem) chapter;
                stringBuilder.append(nullSafeHtmlElement(true, child.getName(), "<h1>%s</h1>"));
                stringBuilder.append(nullSafeHtmlElement(exportOptions.includeSummary, child.getSummary(), "<div><b>%s</b></div>"));
                stringBuilder.append(nullSafeHtmlElement(exportOptions.includeExtendedSummary, child.getExtended_summary(), "<div>%s</div>"));
                stringBuilder.append(nullSafeHtmlElement(exportOptions.includeContent, child.getContent(), "<div>%s</div>"));
            }
        }
        return stringBuilder.toString();
    }

    public GroupingNovelItemService serviceToUse(ExportOptions exportOptions) {
        switch (exportOptions.itemType) {
            case PARTS: return this.partService;
            case CHARACTER_GROUPS: return this.characterGroupService;
            case RESEARCH_GROUPS: return this.researchGroupService;
            case LOCATION_GROUPS: return this.locationGroupService;
        }
        throw new IllegalArgumentException(String.format("unknown export type %s", exportOptions.itemType));
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
