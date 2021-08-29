package de.wortomat.controller;

import de.wortomat.model.Tag;
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
    public ResponseEntity<Tag> create(@PathVariable("novelId") Long novelId, @RequestBody Tag tag) {
        return ResponseEntity.ok(this.tagService.create(novelId, tag));
    }

    @PutMapping
    public ResponseEntity<Tag> update(@PathVariable("novelId") Long novelId, @RequestBody Tag tag) {
        return ResponseEntity.ok(this.tagService.update(novelId, tag));
    }

    @DeleteMapping("{tagId}")
    public ResponseEntity<?> delete(@PathVariable("novelId") Long novelId, @PathVariable("tagId") Long tagId) {
        this.tagService.delete(novelId, tagId);
        return ResponseEntity.ok().build();
    }
}
