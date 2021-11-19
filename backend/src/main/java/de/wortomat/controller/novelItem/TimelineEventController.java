package de.wortomat.controller.novelItem;

import de.wortomat.model.TimelineEvent;
import de.wortomat.service.novelItem.TimelineEventService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/novels/{novelId}/timeline/")
@CrossOrigin(origins = "*")
public class TimelineEventController {
    @Autowired
    private TimelineEventService timelineEventService;

    @PostMapping
    public ResponseEntity<TimelineEvent> create(@PathVariable("novelId") Long novelId, @RequestBody TimelineEvent timelineEvent) {
        return ResponseEntity.ok(this.timelineEventService.create(novelId, timelineEvent));
    }

    @PutMapping
    public ResponseEntity<TimelineEvent> update(@PathVariable("novelId") Long novelId, @RequestBody TimelineEvent timelineEvent) {
        return ResponseEntity.ok(this.timelineEventService.update(novelId, timelineEvent));
    }

    @DeleteMapping("{timelineEventId}")
    public ResponseEntity<?> delete(@PathVariable("novelId") Long novelId, @PathVariable("timelineEventId") Long timelineEventId) {
        this.timelineEventService.delete(novelId, timelineEventId);
        return ResponseEntity.ok().build();
    }

    @DeleteMapping("deleteReference")
    public ResponseEntity<?> delete(@PathVariable("novelId") Long novelId,
                                    @RequestParam("timelineEventId") Long timelineEventId,
                                    @RequestParam("itemId") Long itemId,
                                    @RequestParam("type") String type) {
        if ("chapters".equals(type)) {
            return ResponseEntity.ok(this.timelineEventService.deleteChapterReference(novelId, timelineEventId, itemId));
        } else if("research".equals(type)) {
            return ResponseEntity.ok(this.timelineEventService.deleteResearchReference(novelId, timelineEventId, itemId));
        }
        return ResponseEntity.status(HttpStatus.BAD_REQUEST).build();
    }

    @PutMapping("addReference")
    public ResponseEntity<TimelineEvent> addReference(
            @PathVariable("novelId") Long novelId,
            @RequestParam("timelineEventId") Long timelineEventId,
            @RequestParam("itemId") Long itemId,
            @RequestParam("type") String type) {
        if ("chapters".equals(type)) {
            return ResponseEntity.ok(this.timelineEventService.addChapterReference(novelId, timelineEventId, itemId));
        } else if("research".equals(type)) {
            return ResponseEntity.ok(this.timelineEventService.addResearchReference(novelId, timelineEventId, itemId));
        }
        return ResponseEntity.status(HttpStatus.BAD_REQUEST).build();
    }


    @GetMapping
    public ResponseEntity<List<TimelineEvent>> get(@PathVariable("novelId") Long novelId) {
        return ResponseEntity.ok(this.timelineEventService.getAll(novelId));
    }
}
