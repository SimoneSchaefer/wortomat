package de.wortomat.controller;

import de.wortomat.model.Chapter;
import de.wortomat.model.INovelItem;
import de.wortomat.service.ChapterService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/novels/{novelId}/parts/{partId}/chapters/")
@CrossOrigin(origins = "*")
public class ChapterController {
    @Autowired
    private ChapterService chapterService;

    @PostMapping
    public ResponseEntity<INovelItem> create(
            @PathVariable("novelId") Long novelId,
            @PathVariable("partId") Long partId,
            @RequestBody Chapter chapter) {
        return ResponseEntity.ok(this.chapterService.create(novelId, partId, chapter));
    }

    @PutMapping
    public ResponseEntity<INovelItem> update(
            @PathVariable("novelId") Long novelId,
            @PathVariable("partId") Long partId,
            @RequestBody Chapter chapter) {
        return ResponseEntity.ok(this.chapterService.update(novelId, partId, chapter));
    }

    /*@GetMapping("tags")
    public ResponseEntity<List<ChapterTag>> tags(@PathVariable("novelId") Long novelId) {
        return ResponseEntity.ok(this.chapterService.getTags(novelId));
    }

    @PostMapping("tags")
    public ResponseEntity<ChapterTag> createTag(@PathVariable("novelId") Long novelId, @RequestBody ChapterTag tag) {
        return ResponseEntity.ok(this.chapterService.createTag(novelId, tag));
    }*/

    @DeleteMapping("{chapterId}")
    public ResponseEntity<?> delete(@PathVariable("novelId") Long novelId, @PathVariable("chapterId") Long chapterId) {
        this.chapterService.delete(novelId, chapterId);
        return ResponseEntity.ok().build();
    }
}
