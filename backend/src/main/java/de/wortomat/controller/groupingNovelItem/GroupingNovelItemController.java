package de.wortomat.controller.groupingNovelItem;

import de.wortomat.model.GroupingNovelItem;
import de.wortomat.model.NovelItem;
import de.wortomat.service.groupingNovelItem.GroupingNovelItemService;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

public abstract class GroupingNovelItemController<T extends GroupingNovelItem<S>, S extends NovelItem<T>> {
    abstract protected GroupingNovelItemService<T, S> getService();

    @PostMapping
    public ResponseEntity<T> create(@PathVariable("novelId") Long novelId, @RequestBody T parent) {
        return ResponseEntity.ok(this.getService().create(novelId, parent));
    }

    @PutMapping
    public ResponseEntity<T> update(@PathVariable("novelId") Long novelId, @RequestBody T parent) {
        return ResponseEntity.ok(this.getService().update(novelId, parent));
    }

    @PutMapping("moveChild")
    public ResponseEntity<List<T>> moveChild(@PathVariable("novelId") Long novelId, @RequestBody Map<String, String> updatedPositions) {
        this.getService().moveChild(
                novelId,
                Long.parseLong(updatedPositions.get("childId")),
                Long.parseLong(updatedPositions.get("newParentId")),
                Integer.parseInt(updatedPositions.get("newPosition")));

        return ResponseEntity.ok(this.getService().get(novelId));
    }

    @GetMapping
    public ResponseEntity<List<T>> get(@PathVariable("novelId") Long novelId) {
        return ResponseEntity.ok(this.getService().get(novelId));
    }

    @DeleteMapping("{parentId}")
    public ResponseEntity<?> delete(@PathVariable("novelId") Long novelId, @PathVariable("parentId") Long parentId) {
        this.getService().delete(novelId, parentId);
        return ResponseEntity.ok().build();
    }
}
