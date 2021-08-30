package de.wortomat.controller;

import de.wortomat.service.export.ExportOptions;
import de.wortomat.service.export.ExportService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.io.IOException;

@RestController
@RequestMapping("/novels/{novelId}/export/")
@CrossOrigin(origins = "*")
public class ExportController {

    @Autowired
    ExportService exportService;

    @PostMapping
    public ResponseEntity<String> export(@PathVariable("novelId") Long novelId, @RequestBody ExportOptions exportOptions) throws IOException {
        return ResponseEntity.ok(exportService.export(novelId, exportOptions));
    }
}
