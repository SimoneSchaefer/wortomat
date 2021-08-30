package de.wortomat.controller;

import de.wortomat.model.Chapter;
import de.wortomat.service.ChapterService;
import de.wortomat.service.ExportService;
import de.wortomat.service.FileService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.stereotype.Controller;
import org.springframework.web.bind.annotation.*;

import java.io.IOException;
import java.nio.file.Files;
import java.nio.file.Paths;
import java.nio.file.StandardOpenOption;
import java.util.Date;
import java.util.List;

@Controller
@RequestMapping("/novels/{novelId}/export/")
@CrossOrigin(origins = "*")
public class ExportController {

    @Autowired
    ExportService exportService;

    @Autowired
    ChapterService chapterService;

    @GetMapping
    public ResponseEntity<String> export(
            @PathVariable("novelId") Long novelId,
            @RequestParam boolean includeSummary,
            @RequestParam boolean includeExtendedSummary,
            @RequestParam boolean includeContent) throws IOException {

        return ResponseEntity.ok(exportService.export(novelId, includeSummary, includeExtendedSummary, includeContent));
    }
}
