package de.wortomat.controller.novelItem;

import de.wortomat.model.IGroupingNovelItem;
import de.wortomat.model.INovelItem;
import de.wortomat.model.Image;
import de.wortomat.service.novelItem.NovelItemService;
import de.wortomat.service.uploads.EntityType;
import de.wortomat.service.uploads.FileResponseCreator;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.core.io.Resource;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

import java.io.IOException;

public abstract  class NovelItemController<S extends INovelItem<T>, T extends IGroupingNovelItem<S>> {
    abstract protected NovelItemService<T, S> getService();
    abstract protected EntityType getEntityType();

    @Autowired
    private FileResponseCreator fileResponseCreator;

    @PostMapping
    public ResponseEntity<S> create(
            @PathVariable("novelId") Long novelId,
            @PathVariable("groupId") Long groupId,
            @RequestBody S child) {
        return ResponseEntity.ok(this.getService().create(novelId, groupId, child));
    }

    @PutMapping
    public ResponseEntity<S> update(
            @PathVariable("novelId") Long novelId,
            @PathVariable("groupId") Long groupId,
            @RequestBody S child) {
        return ResponseEntity.ok(this.getService().update(novelId, groupId, child));
    }

    @DeleteMapping("{childId}")
    public ResponseEntity<?> delete(
            @PathVariable("novelId") Long novelId,
            @PathVariable("groupId") Long groupId,
            @PathVariable("childId") Long childId) {
        this.getService().delete(novelId, childId);
        return ResponseEntity.ok().build();
    }

    @PostMapping("{childId}/upload")
    public ResponseEntity<Image> upload(
            @PathVariable("novelId") Long novelId,
            @PathVariable("groupId") Long groupId,
            @PathVariable("childId") Long childId,
            @RequestParam("upload[]") MultipartFile file) throws IOException {
        return ResponseEntity.ok(getService().saveForNovelItem(file, novelId, groupId, childId, getEntityType()));
    }

    @GetMapping("{childId}/files/{fileId}")
    @ResponseBody
    public ResponseEntity<Resource> getFile(
            @PathVariable("novelId") Long novelId,
            @PathVariable("groupId") Long groupId,
            @PathVariable("childId") Long childId,
            @PathVariable("fileId") Long fileId) throws IOException {
        return fileResponseCreator.generateHttpFileResponse(getService().load(novelId, childId, getEntityType(), fileId));
    }

    @DeleteMapping("{childId}/files/{fileId}")
    public ResponseEntity<S> deleteFile(
            @PathVariable("novelId") Long novelId,
            @PathVariable("groupId") Long groupId,
            @PathVariable("childId") Long childId,
            @PathVariable("fileId") Long fileId) throws IOException {
        getService().delete(novelId, groupId, childId, getEntityType(), fileId);
        return ResponseEntity.ok(getService().get(novelId, groupId, childId));
    }
}
