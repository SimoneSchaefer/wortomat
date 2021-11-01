package de.wortomat.controller;

import de.wortomat.model.ResearchGroup;
import de.wortomat.service.ResearchGroupService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/novels/{novelId}/research-groups/")
@CrossOrigin(origins = "*")
public class ResearchGroupController {
    @Autowired
    private ResearchGroupService researchGroupService;

    @PostMapping
    public ResponseEntity<ResearchGroup> create(@PathVariable("novelId") Long novelId, @RequestBody ResearchGroup part) {
        return ResponseEntity.ok(this.researchGroupService.create(novelId, part));
    }

    @PutMapping
    public ResponseEntity<ResearchGroup> update(@PathVariable("novelId") Long novelId, @RequestBody ResearchGroup part) {
        return ResponseEntity.ok(this.researchGroupService.update(novelId, part));
    }

    @PutMapping("moveChild")
    public ResponseEntity<?> moveChild(@PathVariable("novelId") Long novelId, @RequestBody Map<String, String> updatedPositions) {
        this.researchGroupService.moveChild(
                novelId,
                Long.parseLong(updatedPositions.get("childId")),
                Long.parseLong(updatedPositions.get("newParentId")),
                Integer.parseInt(updatedPositions.get("newPosition")));

        return ResponseEntity.ok(this.researchGroupService.get(novelId));
    }

    @GetMapping
    public ResponseEntity<List<ResearchGroup>> get(@PathVariable("novelId") Long novelId) {
        return ResponseEntity.ok(this.researchGroupService.get(novelId));
    }

    @DeleteMapping("{partId}")
    public ResponseEntity<?> delete(@PathVariable("novelId") Long novelId, @PathVariable("partId") Long partId) {
        this.researchGroupService.delete(novelId, partId);
        return ResponseEntity.ok().build();
    }
}
