package de.wortomat.controller;

import de.wortomat.model.Chapter;
import de.wortomat.service.ChapterService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/novels/{novelId}/chapters/")
@CrossOrigin(origins = "*")
public class ChapterController {
    @Autowired
    private ChapterService chapterService;

    @PostMapping
    public ResponseEntity<Chapter> create(@PathVariable("novelId") Long novelId, @RequestBody Chapter chapter) {
        return ResponseEntity.ok(this.chapterService.create(novelId, chapter));
    }

    @PutMapping
    public ResponseEntity<Chapter> update(@PathVariable("novelId") Long novelId, @RequestBody Chapter chapter) {
        return ResponseEntity.ok(this.chapterService.update(novelId, chapter));
    }

    @GetMapping
    public ResponseEntity<List<Chapter>> get(@PathVariable("novelId") Long novelId) {
        return ResponseEntity.ok(this.chapterService.get(novelId));
    }

    @DeleteMapping("{chapterId}")
    public ResponseEntity<?> delete(@PathVariable("novelId") Long novelId, @PathVariable("chapterId") Long chapterId) {
        this.chapterService.delete(novelId, chapterId);
        return ResponseEntity.ok().build();
    }

    @PutMapping("updatePositions")
    public ResponseEntity<List<Chapter>> updatePosition(@PathVariable("novelId") Long novelId, @RequestBody List<Long> updatedPositions) {
        return ResponseEntity.ok(this.chapterService.updatePositions(novelId, updatedPositions));
    }
}
