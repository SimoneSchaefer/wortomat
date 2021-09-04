package de.wortomat.controller;

import de.wortomat.model.Character;
import de.wortomat.model.Image;
import de.wortomat.service.CharacterService;
import de.wortomat.service.FileService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.core.io.Resource;
import org.springframework.http.HttpHeaders;
import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

import java.io.IOException;
import java.io.UnsupportedEncodingException;
import java.net.URLDecoder;
import java.nio.charset.Charset;
import java.util.ArrayList;
import java.util.Arrays;
import java.util.List;
import java.util.Objects;

@RestController
@RequestMapping("/novels/{novelId}/characters/")
@CrossOrigin(origins = "*")
public class CharacterController {
    @Autowired
    private CharacterService characterService;

    @Autowired
    private FileService fileService;

    @PostMapping("{characterId}/upload")
    public ResponseEntity<Image> upload(@PathVariable("novelId") Long novelId, @PathVariable("characterId") Long characterId, @RequestParam("upload[]") MultipartFile file)  {
        try {
            Image image = fileService.save(file);
            Character character = characterService.get(novelId, characterId);
            character.getImages().add(image);
            this.characterService.update(novelId, character);
            return ResponseEntity.ok(image);
        } catch(IOException e) {
            return ResponseEntity.status(HttpStatus.METHOD_NOT_ALLOWED).build();
        }
    }

    @GetMapping("{characterId}/files/{fileId}")
    @ResponseBody
    public ResponseEntity<Resource> getFile(@PathVariable("novelId") Long novelId, @PathVariable("characterId") Long characterId, @PathVariable("fileId") Long fileId) throws IOException {
        Resource file = fileService.load(fileId);
        String[] splitFileName = Objects.requireNonNull(file.getFilename()).split("\\.");
        String contentType = "";
        if (splitFileName.length > 0) {
            contentType = "image/" + splitFileName[splitFileName.length - 1];
        }
        return ResponseEntity.ok()
                .header(HttpHeaders.CONTENT_DISPOSITION, "inline; filename=\"" + file.getFilename() + "\"")
                .contentType(MediaType.parseMediaType(contentType))
                .body(file);
    }
    @DeleteMapping("{characterId}/files/{fileId}")
    public ResponseEntity<Character> deleteFile(@PathVariable("novelId") Long novelId, @PathVariable("characterId") Long characterId, @PathVariable("fileId") Long fileId) throws IOException {
        Character character = characterService.get(novelId, characterId);
        Image toDelete = character.getImages().stream().filter(image -> image.getId().equals(fileId)).findFirst().get();
        character.getImages().remove(toDelete);
        characterService.update(novelId, character);

        fileService.delete(fileId);
        return ResponseEntity.ok(characterService.get(novelId, characterId));
    }

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
}
