package de.wortomat.controller;

import de.wortomat.model.LocationGroup;
import de.wortomat.service.LocationGroupService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/novels/{novelId}/location-groups/")
@CrossOrigin(origins = "*")
public class LocationGroupController {
    @Autowired
    private LocationGroupService locationGroupService;

    @PostMapping
    public ResponseEntity<LocationGroup> create(@PathVariable("novelId") Long novelId, @RequestBody LocationGroup locationGroup) {
        return ResponseEntity.ok(this.locationGroupService.create(novelId, locationGroup));
    }

    @PutMapping
    public ResponseEntity<LocationGroup> update(@PathVariable("novelId") Long novelId, @RequestBody LocationGroup locationGroup) {
        return ResponseEntity.ok(this.locationGroupService.update(novelId, locationGroup));
    }

    @PutMapping("moveChild")
    public ResponseEntity<?> moveChild(@PathVariable("novelId") Long novelId, @RequestBody Map<String, String> updatedPositions) {
        this.locationGroupService.moveChild(
                novelId,
                Long.parseLong(updatedPositions.get("childId")),
                Long.parseLong(updatedPositions.get("newParentId")),
                Integer.parseInt(updatedPositions.get("newPosition")));

        return ResponseEntity.ok(this.locationGroupService.get(novelId));
    }

    @GetMapping
    public ResponseEntity<List<LocationGroup>> get(@PathVariable("novelId") Long novelId) {
        return ResponseEntity.ok(this.locationGroupService.get(novelId));
    }

    @DeleteMapping("{partId}")
    public ResponseEntity<?> delete(@PathVariable("novelId") Long novelId, @PathVariable("partId") Long partId) {
        this.locationGroupService.delete(novelId, partId);
        return ResponseEntity.ok().build();
    }
}
