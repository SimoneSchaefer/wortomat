package de.wortomat.controller;

import de.wortomat.model.Novel;
import de.wortomat.service.NovelService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/novels/")
@CrossOrigin
public class NovelController {

    @Autowired
    NovelService novelService;

    @PostMapping
    public ResponseEntity<Novel> createNovel(@RequestBody Novel novel) {
        return ResponseEntity.ok(novelService.create(novel));
    }

    @PutMapping
    public ResponseEntity<Novel> updateNovel(@RequestBody Novel novel) {
        return ResponseEntity.ok(novelService.update(novel));
    }

    @GetMapping
    public ResponseEntity<List<Novel>> novel() {
        return ResponseEntity.ok(novelService.get());
    }

    @GetMapping("/{novelId}")
    public ResponseEntity<Novel> novel(@PathVariable("novelId") Long novelId) {
        return ResponseEntity.ok(novelService.get(novelId));
    }

    @DeleteMapping("/{novelId}")
    public ResponseEntity<?> delete(@PathVariable("novelId") Long novelId) {
        novelService.delete(novelId);
        return ResponseEntity.status(200).build();
    }
}
