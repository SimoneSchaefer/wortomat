package de.wortomat.controller;

import de.wortomat.model.Character;
import de.wortomat.model.Image;
import de.wortomat.service.CharacterService;
import de.wortomat.service.uploads.EntityType;
import de.wortomat.service.uploads.FileResponseCreator;
import de.wortomat.service.uploads.ImageAwareNovelItemService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.core.io.Resource;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

import java.io.IOException;
import java.util.List;

@RestController
@RequestMapping("/novels/{novelId}/characters/")
@CrossOrigin(origins = "*")
public class CharacterController {
    @Autowired
    private CharacterService characterService;

    @Autowired
    private ImageAwareNovelItemService imageAwareNovelItemService;

    @Autowired
    private FileResponseCreator fileResponseCreator;


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

    @PostMapping("{characterId}/upload")
    public ResponseEntity<Image> upload(@PathVariable("novelId") Long novelId, @PathVariable("characterId") Long characterId, @RequestParam("upload[]") MultipartFile file) throws IOException {
        return ResponseEntity.ok(imageAwareNovelItemService.saveForNovelItem(file, characterService, novelId, characterId, EntityType.CHARACTER));
    }

    @GetMapping("{characterId}/files/{fileId}")
    @ResponseBody
    public ResponseEntity<Resource> getFile(@PathVariable("novelId") Long novelId, @PathVariable("characterId") Long characterId, @PathVariable("fileId") Long fileId) throws IOException {
        return fileResponseCreator.generateHttpFileResponse(imageAwareNovelItemService.load(novelId, characterId, EntityType.CHARACTER, fileId));
    }

    @DeleteMapping("{characterId}/files/{fileId}")
    public ResponseEntity<Character> deleteFile(@PathVariable("novelId") Long novelId, @PathVariable("characterId") Long characterId, @PathVariable("fileId") Long fileId) throws IOException {
        imageAwareNovelItemService.delete(characterService, novelId, characterId, EntityType.CHARACTER, fileId);
        return ResponseEntity.ok(characterService.get(novelId, characterId));
    }

}
