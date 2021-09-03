package de.wortomat.controller;

import de.wortomat.model.Research;
import de.wortomat.service.ResearchService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/novels/{novelId}/research/")
@CrossOrigin(origins = "*")
public class ResearchController {
    @Autowired
    private ResearchService researchService;

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

    @DeleteMapping("{chapterId}")
    public ResponseEntity<?> delete(@PathVariable("novelId") Long novelId, @PathVariable("chapterId") Long chapterId) {
        this.researchService.delete(novelId, chapterId);
        return ResponseEntity.ok().build();
    }

    @PutMapping("updatePositions")
    public ResponseEntity<List<Research>> updatePosition(@PathVariable("novelId") Long novelId, @RequestBody List<Long> updatedPositions) {
        return ResponseEntity.ok(this.researchService.updatePositions(novelId, updatedPositions));
    }
}
