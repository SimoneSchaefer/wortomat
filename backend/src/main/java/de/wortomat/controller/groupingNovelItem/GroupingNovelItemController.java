package de.wortomat.controller.groupingNovelItem;

import de.wortomat.model.*;
import de.wortomat.repository.NovelItemRepository;
import de.wortomat.repository.NovelItemTagRepository;
import de.wortomat.service.NovelService;
import de.wortomat.service.groupingNovelItem.GroupingNovelItemService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

public abstract class GroupingNovelItemController<T extends IGroupingNovelItem<S>, S extends INovelItem<T>, U extends INovelItemTag> {
    abstract protected GroupingNovelItemService<T, S, U> getService();
    // abstract NovelItemRepository<S> getRepository();

    @Autowired
    NovelService novelService;

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

    @PutMapping("moveParent")
    public ResponseEntity<List<T>> moveParent(@PathVariable("novelId") Long novelId, @RequestBody Map<String, String> updatedPositions) {
        this.getService().moveParent(
                novelId,
                Long.parseLong(updatedPositions.get("parentId")),
                Integer.parseInt(updatedPositions.get("oldPosition")),
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

    @GetMapping("tags")
    public ResponseEntity<List<?>> getTags(@PathVariable("novelId") Long novelId) {
        return ResponseEntity.ok(getService().getTags(novelId));
    }


    @PostMapping("tags")
    public ResponseEntity createTag(
            @PathVariable("novelId") Long novelId,
            @RequestBody U tag) {
        Object stored = getService().createTag(novelId, tag);
        return ResponseEntity.ok(stored);
    }
}
