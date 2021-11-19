package de.wortomat.controller.novelItem;

import de.wortomat.model.Character;
import de.wortomat.model.Image;
import de.wortomat.model.INovelItem;
import de.wortomat.service.novelItem.CharacterService;
import de.wortomat.service.uploads.EntityType;
import de.wortomat.service.uploads.FileResponseCreator;
import de.wortomat.service.uploads.ImageAwareNovelItemService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.core.io.Resource;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

import java.io.IOException;

@RestController
@RequestMapping("/novels/{novelId}/character-groups/{groupId}/characters/")
@CrossOrigin(origins = "*")
public class CharacterController {
    @Autowired
    private CharacterService characterService;

    @Autowired
    private ImageAwareNovelItemService imageAwareNovelItemService;

    @Autowired
    private FileResponseCreator fileResponseCreator;

    @Autowired
    private CharacterService chapterService;

    @PostMapping
    public ResponseEntity<INovelItem> create(
            @PathVariable("novelId") Long novelId,
            @PathVariable("groupId") Long groupId,
            @RequestBody Character character) {
        return ResponseEntity.ok(this.chapterService.create(novelId, groupId, character));
    }

    @PutMapping
    public ResponseEntity<Character> update(
            @PathVariable("novelId") Long novelId,
            @PathVariable("groupId") Long groupId,
            @RequestBody Character chapter) {
        return ResponseEntity.ok(this.chapterService.update(novelId, groupId, chapter));
    }

   /* @GetMapping("tags")
    public ResponseEntity<List<CharacterTag>> tags(@PathVariable("novelId") Long novelId) {
        return ResponseEntity.ok(this.chapterService.getTags(novelId));
    }

    @PostMapping("tags")
    public ResponseEntity<CharacterTag> createTag(@PathVariable("novelId") Long novelId, @RequestBody CharacterTag tag) {
        return ResponseEntity.ok(this.chapterService.createTag(novelId, tag));
    }*/

    @DeleteMapping("{characterId}")
    public ResponseEntity<?> delete(@PathVariable("novelId") Long novelId, @PathVariable("characterId") Long characterId) {
        this.chapterService.delete(novelId, characterId);
        return ResponseEntity.ok().build();
    }

    @PostMapping("{characterId}/upload")
    public ResponseEntity<Image> upload(@PathVariable("novelId") Long novelId, @PathVariable("characterId") Long characterId, @RequestParam("upload[]") MultipartFile file) throws IOException {
        return ResponseEntity.ok(imageAwareNovelItemService.saveForNovelItem(file, characterService, novelId, characterId, EntityType.CHARACTERS));
    }

    @GetMapping("{characterId}/files/{fileId}")
    @ResponseBody
    public ResponseEntity<Resource> getFile(@PathVariable("novelId") Long novelId, @PathVariable("characterId") Long characterId, @PathVariable("fileId") Long fileId) throws IOException {
        return fileResponseCreator.generateHttpFileResponse(imageAwareNovelItemService.load(novelId, characterId, EntityType.CHARACTERS, fileId));
    }

    @DeleteMapping("{characterId}/files/{fileId}")
    public ResponseEntity<Character> deleteFile(@PathVariable("novelId") Long novelId, @PathVariable("characterId") Long characterId, @PathVariable("fileId") Long fileId) throws IOException {
        imageAwareNovelItemService.delete(characterService, novelId, characterId, EntityType.CHARACTERS, fileId);
        return ResponseEntity.ok(characterService.get(novelId, characterId));
    }

}
