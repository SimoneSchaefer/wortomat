package de.wortomat.controller;

import de.wortomat.model.TimelineEvent;
import de.wortomat.service.TimelineEventService;
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

    @PutMapping("addChapter")
    public ResponseEntity<TimelineEvent> addChapterReference(
            @PathVariable("novelId") Long novelId,
            @RequestParam("timelineEventId") Long timelineEventId,
            @RequestParam("chapterId") Long chapterId) {
        return ResponseEntity.ok(this.timelineEventService.addChapterReference(novelId, timelineEventId, chapterId));
    }

    @PutMapping("addResearch")
    public ResponseEntity<TimelineEvent> addResearchReference(
            @PathVariable("novelId") Long novelId,
            @RequestParam("timelineEventId") Long timelineEventId,
            @RequestParam("researchId") Long researchId) {
        return ResponseEntity.ok(this.timelineEventService.addResearchReference(novelId, timelineEventId, researchId));
    }

    @GetMapping
    public ResponseEntity<List<TimelineEvent>> get(@PathVariable("novelId") Long novelId) {
        return ResponseEntity.ok(this.timelineEventService.getAll(novelId));
    }
}
