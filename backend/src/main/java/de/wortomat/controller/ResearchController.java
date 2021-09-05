package de.wortomat.controller;

import de.wortomat.model.Image;
import de.wortomat.model.Research;
import de.wortomat.service.ResearchService;
import de.wortomat.service.uploads.EntityType;
import de.wortomat.service.uploads.FileResponseCreator;
import de.wortomat.service.uploads.ImageAwareNovelItemService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.core.io.Resource;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

import java.io.IOException;
import java.util.List;

@RestController
@RequestMapping("/novels/{novelId}/research/")
@CrossOrigin(origins = "*")
public class ResearchController {
    @Autowired
    private ResearchService researchService;

    @Autowired
    private ImageAwareNovelItemService imageAwareNovelItemService;

    @Autowired
    private FileResponseCreator fileResponseCreator;

    @PostMapping
    public ResponseEntity<Research> create(@PathVariable("novelId") Long novelId, @RequestBody Research research) {
        return ResponseEntity.ok(this.researchService.create(novelId, research));
    }

    @PutMapping
    public ResponseEntity<Research> update(@PathVariable("novelId") Long novelId, @RequestBody Research research) {
        return ResponseEntity.ok(this.researchService.update(novelId, research));
    }

    @GetMapping
    public ResponseEntity<List<Research>> get(@PathVariable("novelId") Long novelId) {
        return ResponseEntity.ok(this.researchService.get(novelId));
    }

    @DeleteMapping("{researchId}")
    public ResponseEntity<?> delete(@PathVariable("novelId") Long novelId, @PathVariable("researchId") Long researchId) {
        this.researchService.delete(novelId, researchId);
        return ResponseEntity.ok().build();
    }

    @PutMapping("updatePositions")
    public ResponseEntity<List<Research>> updatePosition(@PathVariable("novelId") Long novelId, @RequestBody List<Long> updatedPositions) {
        return ResponseEntity.ok(this.researchService.updatePositions(novelId, updatedPositions));
    }


    @PostMapping("{researchId}/upload")
    public ResponseEntity<Image> upload(@PathVariable("novelId") Long novelId, @PathVariable("researchId") Long researchId, @RequestParam("upload[]") MultipartFile file) throws IOException {
        return ResponseEntity.ok(imageAwareNovelItemService.saveForNovelItem(file, researchService, novelId, researchId, EntityType.RESEARCH));
    }

    @GetMapping("{researchId}/files/{fileId}")
    @ResponseBody
    public ResponseEntity<Resource> getFile(@PathVariable("novelId") Long novelId, @PathVariable("researchId") Long researchId, @PathVariable("fileId") Long fileId) throws IOException {
        return fileResponseCreator.generateHttpFileResponse(imageAwareNovelItemService.load(novelId, researchId, EntityType.RESEARCH, fileId));
    }

    @DeleteMapping("{researchId}/files/{fileId}")
    public ResponseEntity<Research> deleteFile(@PathVariable("novelId") Long novelId, @PathVariable("researchId") Long researchId, @PathVariable("fileId") Long fileId) throws IOException {
        imageAwareNovelItemService.delete(researchService, novelId, researchId, EntityType.RESEARCH, fileId);
        return ResponseEntity.ok(researchService.get(novelId, researchId));
    }
}
