package de.wortomat.controller;

import de.wortomat.model.Character;
import de.wortomat.service.CharacterService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/novels/{novelId}/characters/")
@CrossOrigin(origins = "*")
public class CharacterController {
    @Autowired
    private CharacterService characterService;

    @PostMapping
    public ResponseEntity<Character> create(@PathVariable("novelId") Long novelId, @RequestBody Character character) {
        return ResponseEntity.ok(this.characterService.create(novelId, character));
    }

    @PutMapping
    public ResponseEntity<Character> update(@PathVariable("novelId") Long novelId, @RequestBody Character character) {
        return ResponseEntity.ok(this.characterService.update(novelId, character));
    }

    @GetMapping
    public ResponseEntity<List<Character>> get(@PathVariable("novelId") Long novelId) {
        return ResponseEntity.ok(this.characterService.get(novelId));
    }

    @DeleteMapping("{chapterId}")
    public ResponseEntity<?> delete(@PathVariable("novelId") Long novelId, @PathVariable("chapterId") Long chapterId) {
        this.characterService.delete(novelId, chapterId);
        return ResponseEntity.ok().build();
    }

    @PutMapping("updatePositions")
    public ResponseEntity<List<Character>> updatePosition(@PathVariable("novelId") Long novelId, @RequestBody List<Long> updatedPositions) {
        return ResponseEntity.ok(this.characterService.updatePositions(novelId, updatedPositions));
    }
}
