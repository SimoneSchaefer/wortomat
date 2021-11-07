package de.wortomat.controller;

import de.wortomat.model.*;
import de.wortomat.repository.tags.LocationTagRepository;
import de.wortomat.service.LocationService;
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
@RequestMapping("/novels/{novelId}/location-groups/{groupId}/locations/")
@CrossOrigin(origins = "*")
public class LocationController {
    @Autowired
    private LocationService locationService;

    @Autowired
    private ImageAwareNovelItemService imageAwareNovelItemService;

    @Autowired
    private FileResponseCreator fileResponseCreator;

    @PostMapping
    public ResponseEntity<NovelItem> create(
            @PathVariable("novelId") Long novelId,
            @PathVariable("groupId") Long groupId,
            @RequestBody Location location) {
        return ResponseEntity.ok(this.locationService.create(novelId, groupId, location));
    }

    @PutMapping
    public ResponseEntity<NovelItem> update(
            @PathVariable("novelId") Long novelId,
            @PathVariable("groupId") Long groupId,
            @RequestBody Location location) {
        return ResponseEntity.ok(this.locationService.update(novelId, groupId, location));
    }

    @DeleteMapping("{researchId}")
    public ResponseEntity<?> delete(@PathVariable("novelId") Long novelId, @PathVariable("locationId") Long locationId) {
        this.locationService.delete(novelId, locationId);
        return ResponseEntity.ok().build();
    }

   /*
    @GetMapping("tags")
    public ResponseEntity<List<LocationTag>> tags(@PathVariable("novelId") Long novelId) {
        return ResponseEntity.ok(this.locationService.getTags(novelId));
    }

    @PostMapping("tags")
    public ResponseEntity<LocationTag> createTag(@PathVariable("novelId") Long novelId, @RequestBody LocationTag tag) {
        return ResponseEntity.ok(this.locationService.createTag(novelId, tag));
    }*/

    @PostMapping("{locationId}/upload")
    public ResponseEntity<Image> upload(@PathVariable("novelId") Long novelId, @PathVariable("locationId") Long locationId, @RequestParam("upload[]") MultipartFile file) throws IOException {
        return ResponseEntity.ok(imageAwareNovelItemService.saveForNovelItem(file, locationService, novelId, locationId, EntityType.LOCATION));
    }

    @GetMapping("{locationId}/files/{fileId}")
    @ResponseBody
    public ResponseEntity<Resource> getFile(@PathVariable("novelId") Long novelId, @PathVariable("locationId") Long locationId, @PathVariable("fileId") Long fileId) throws IOException {
        return fileResponseCreator.generateHttpFileResponse(imageAwareNovelItemService.load(novelId, locationId, EntityType.LOCATION, fileId));
    }

    @DeleteMapping("{locationId}/files/{fileId}")
    public ResponseEntity<Location> deleteFile(@PathVariable("novelId") Long novelId, @PathVariable("locationId") Long locationId, @PathVariable("fileId") Long fileId) throws IOException {
        imageAwareNovelItemService.delete(locationService, novelId, locationId, EntityType.LOCATION, fileId);
        return ResponseEntity.ok(locationService.get(novelId, locationId));
    }
}
