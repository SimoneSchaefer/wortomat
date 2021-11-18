package de.wortomat.service;

import de.wortomat.exceptions.NotFoundException;
import de.wortomat.factories.ChapterFactory;
import de.wortomat.factories.NovelFactory;
import de.wortomat.factories.PartFactory;
import de.wortomat.model.Chapter;
import de.wortomat.model.Novel;
import de.wortomat.model.Part;
import de.wortomat.repository.ChapterRepository;
import de.wortomat.repository.NovelRepository;
import de.wortomat.repository.PartsRepository;
import org.junit.jupiter.api.Assertions;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.boot.test.mock.mockito.MockBean;
import org.springframework.test.web.servlet.MockMvc;

import java.util.Arrays;
import java.util.List;
import java.util.Optional;

import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

@SpringBootTest
@AutoConfigureMockMvc
public class PartServiceTest {
    @Autowired
    private MockMvc mockMvc;

    @MockBean
    private NovelRepository novelRepository;

    @Autowired
    private NovelService novelService;

    @Autowired
    private PartService partService;

    @MockBean
    private ChapterRepository chapterRepository;

    @MockBean
    private PartsRepository partsRepository;

    @Test
    public void get_shouldReturnAllPartsWithSortedChapters() {
        Novel novel = NovelFactory.createMockNovel();
        List<Part> allParts = createDummyPartsWithChapter();

        when(partsRepository.findAllByNovelIdOrderByPosition(novel.getId())).thenReturn(allParts);

        List<Part> resultParts = partService.get(novel.getId());
        Assertions.assertEquals(allParts, resultParts);
        Assertions.assertEquals(1, allParts.get(0).getChapters().get(0).getPosition());
        Assertions.assertEquals(2, allParts.get(0).getChapters().get(1).getPosition());
        Assertions.assertEquals(3, allParts.get(0).getChapters().get(2).getPosition());

        verify(partsRepository).findAllByNovelIdOrderByPosition(novel.getId());
    }

    @Test
    public void get_shouldReturnExistingPartWithSortedChapters() {
        Novel novel = NovelFactory.createMockNovel();
        Part part = createDummyPartWithChapters();

        when(partsRepository.findById(part.getId())).thenReturn(Optional.of(part));

        Part resultPart = partService.get(novel.getId(), part.getId());
        Assertions.assertEquals(part, resultPart);
        Assertions.assertEquals(1, resultPart.getChapters().get(0).getPosition());
        Assertions.assertEquals(2, resultPart.getChapters().get(1).getPosition());
        Assertions.assertEquals(3, resultPart.getChapters().get(2).getPosition());

        verify(partsRepository).findById(part.getId());
    }

    @Test
    public void get_shouldThrowErrorForNonExistingPart() {
        Novel novel = NovelFactory.createMockNovel();
        Part part = createDummyPartWithChapters();
        when(partsRepository.findById(part.getId())).thenReturn(java.util.Optional.empty());
        Assertions.assertThrows(NotFoundException.class, () -> partService.get(novel.getId(), part.getId()));
    }

    @Test
    public void create_shouldCreateNewItemWithCorrectPosition() {
        Part part1 = PartFactory.createMockPart();
        part1.setPosition(508);

        Novel novel = NovelFactory.createMockNovel();
        Part part = PartFactory.createMockPart();
        when(novelRepository.findById(novel.getId())).thenReturn(Optional.of(novel));
        when(partsRepository.findById(part.getId())).thenReturn(Optional.of(part));
        when(partsRepository.save(part)).thenReturn(part);
        when(partsRepository.findTopByNovelIdOrderByPositionDesc(novel.getId())).thenReturn(part1);

        Part savedPart = partService.create(novel.getId(), part);
        Assertions.assertEquals(savedPart, part);
        Assertions.assertEquals(509, savedPart.getPosition());
        Assertions.assertEquals(novel, savedPart.getNovel());
    }

    @Test
    public void update_shouldUpdateItem() {
        Novel novel = NovelFactory.createMockNovel();
        Part part = PartFactory.createMockPart();
        when(novelRepository.findById(novel.getId())).thenReturn(Optional.of(novel));
        when(partsRepository.save(part)).thenReturn(part);
        when(partsRepository.findById(part.getId())).thenReturn(Optional.of(part));

        Part savedPart = partService.update(novel.getId(), part);
        Assertions.assertEquals(savedPart, part);
        Assertions.assertEquals(novel, savedPart.getNovel());
    }

    @Test
    public void delete_shouldDeleteItemAndChildren() {
        Novel novel = NovelFactory.createMockNovel();
        Part part = createDummyPartWithChapters();
        when(partsRepository.findById(part.getId())).thenReturn(Optional.of(part));

        partService.delete(novel.getId(), part.getId());
        verify(partsRepository).deleteById(part.getId());
        verify(chapterRepository).deleteAll(part.getChildren());
    }

    private List<Part> createDummyPartsWithChapter() {
        Part part = createDummyPartWithChapters();
        Part otherPart = PartFactory.createMockPart();
        return Arrays.asList(part, otherPart);
    }

    private Part createDummyPartWithChapters() {
        Part part = PartFactory.createMockPart();
        Chapter chapter1 = ChapterFactory.createMockChapter();
        chapter1.setPosition(3);
        Chapter chapter2 = ChapterFactory.createMockChapter();
        chapter2.setPosition(1);
        Chapter chapter3 = ChapterFactory.createMockChapter();
        chapter3.setPosition(2);
        part.setChapters(Arrays.asList(chapter1, chapter2, chapter3));
        return part;
    }
}
