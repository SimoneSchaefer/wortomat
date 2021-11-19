package de.wortomat.controller;

import de.wortomat.model.CharacterGroup;
import de.wortomat.service.groupingNovelItem.CharacterGroupService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/novels/{novelId}/character-groups/")
@CrossOrigin(origins = "*")
public class CharacterGroupController {
    @Autowired
    private CharacterGroupService characterGroupService;

    @PostMapping
    public ResponseEntity<CharacterGroup> create(@PathVariable("novelId") Long novelId, @RequestBody CharacterGroup part) {
        return ResponseEntity.ok(this.characterGroupService.create(novelId, part));
    }

    @PutMapping
    public ResponseEntity<CharacterGroup> update(@PathVariable("novelId") Long novelId, @RequestBody CharacterGroup part) {
        return ResponseEntity.ok(this.characterGroupService.update(novelId, part));
    }

    @PutMapping("moveChild")
    public ResponseEntity<?> moveChild(@PathVariable("novelId") Long novelId, @RequestBody Map<String, String> updatedPositions) {
        this.characterGroupService.moveChild(
                novelId,
                Long.parseLong(updatedPositions.get("childId")),
                Long.parseLong(updatedPositions.get("newParentId")),
                Integer.parseInt(updatedPositions.get("newPosition")));

        return ResponseEntity.ok(this.characterGroupService.get(novelId));
    }

    @GetMapping
    public ResponseEntity<List<CharacterGroup>> get(@PathVariable("novelId") Long novelId) {
        return ResponseEntity.ok(this.characterGroupService.get(novelId));
    }

    @DeleteMapping("{characterGroupId}")
    public ResponseEntity<?> delete(@PathVariable("novelId") Long novelId, @PathVariable("characterGroupId") Long partId) {
        this.characterGroupService.delete(novelId, partId);
        return ResponseEntity.ok().build();
    }
}
