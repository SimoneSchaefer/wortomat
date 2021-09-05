package de.wortomat.controller;

import de.wortomat.model.ChapterTag;
import de.wortomat.service.TagService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;


@RestController
@RequestMapping("/novels/{novelId}/tags/")
@CrossOrigin(origins = "*")
public class TagController {
    @Autowired
    private TagService tagService;

    @PostMapping
    public ResponseEntity<ChapterTag> create(@PathVariable("novelId") Long novelId, @RequestBody ChapterTag tag) {
        return ResponseEntity.ok(this.tagService.create(novelId, tag));
    }

    @PutMapping
    public ResponseEntity<ChapterTag> update(@PathVariable("novelId") Long novelId, @RequestBody ChapterTag tag) {
        return ResponseEntity.ok(this.tagService.update(novelId, tag));
    }

    @DeleteMapping("{tagId}")
    public ResponseEntity<?> delete(@PathVariable("novelId") Long novelId, @PathVariable("tagId") Long tagId) {
        this.tagService.delete(novelId, tagId);
        return ResponseEntity.ok().build();
    }
}
