package de.wortomat.controller;

import de.wortomat.model.Part;
import de.wortomat.service.PartService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/novels/{novelId}/parts/")
@CrossOrigin(origins = "*")
public class PartController {
    @Autowired
    private PartService partService;

    @PostMapping
    public ResponseEntity<Part> create(@PathVariable("novelId") Long novelId, @RequestBody Part part) {
        return ResponseEntity.ok(this.partService.create(novelId, part));
    }

    @PutMapping
    public ResponseEntity<Part> update(@PathVariable("novelId") Long novelId, @RequestBody Part part) {
        return ResponseEntity.ok(this.partService.update(novelId, part));
    }

    @PutMapping("moveChild")
    public ResponseEntity<?> moveChild(@PathVariable("novelId") Long novelId, @RequestBody Map<String, String> updatedPositions) {
        System.out.println("updatedPositions" + updatedPositions);
        this.partService.moveChild(
                novelId,
                Long.parseLong(updatedPositions.get("childId")),
                Long.parseLong(updatedPositions.get("newParentId")),
                Integer.parseInt(updatedPositions.get("newPosition")));

        return ResponseEntity.ok(this.partService.get(novelId));
    }

    @GetMapping
    public ResponseEntity<List<Part>> get(@PathVariable("novelId") Long novelId) {
        return ResponseEntity.ok(this.partService.get(novelId));
    }

    @DeleteMapping("{partId}")
    public ResponseEntity<?> delete(@PathVariable("novelId") Long novelId, @PathVariable("partId") Long partId) {
        this.partService.delete(novelId, partId);
        return ResponseEntity.ok().build();
    }
}
