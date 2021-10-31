package de.wortomat.controller;

import de.wortomat.model.Part;
import de.wortomat.service.PartService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

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

    @GetMapping
    public ResponseEntity<List<Part>> get(@PathVariable("novelId") Long novelId) {
        return ResponseEntity.ok(this.partService.get(novelId));
    }

    @DeleteMapping("{partId}")
    public ResponseEntity<?> delete(@PathVariable("novelId") Long novelId, @PathVariable("partId") Long partId) {
        this.partService.delete(novelId, partId);
        return ResponseEntity.ok().build();
    }

    @PutMapping("updatePositions")
    public ResponseEntity<List<Part>> updatePosition(@PathVariable("novelId") Long novelId, @RequestBody List<Long> updatedPositions) {
        return ResponseEntity.ok(this.partService.updatePositions(novelId, updatedPositions));
    }
}
