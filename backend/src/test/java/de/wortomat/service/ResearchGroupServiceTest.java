package de.wortomat.service;

import de.wortomat.factories.FactoryUtils;
import de.wortomat.factories.ResearchGroupFactory;
import de.wortomat.model.ResearchBuilder;
import de.wortomat.model.ResearchGroup;
import de.wortomat.model.ResearchGroupBuilder;
import de.wortomat.repository.NovelRepository;
import de.wortomat.repository.ResearchGroupRepository;
import de.wortomat.repository.ResearchRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.boot.test.mock.mockito.MockBean;
import org.springframework.test.web.servlet.MockMvc;

import java.util.Arrays;
import java.util.List;
import java.util.Random;

@SpringBootTest
@AutoConfigureMockMvc
public class ResearchGroupServiceTest {
    @Autowired
    private MockMvc mockMvc;

    @MockBean
    private NovelRepository novelRepository;

    @Autowired
    private NovelService novelService;

    @Autowired
    private ResearchGroupService researchGroupService;

    @MockBean
    private ResearchRepository researchRepository;

    @MockBean
    private ResearchGroupRepository researchGroupRepository;
/*
    @Test
    public void get_shouldReturnAllPartsWithSortedChapters() {
        Novel novel = NovelFactory.createMockNovel();
        List<ResearchGroup> allParents = createDummyParentsWithChildren();

        when(researchGroupRepository.findAllByNovelIdOrderByPosition(novel.getId())).thenReturn(allParents);

        List<Part> resultParts = researchGroup.get(novel.getId());
        Assertions.assertEquals(allParts, resultParts);
        Assertions.assertEquals(1, allParts.get(0).getChapters().get(0).getPosition());
        Assertions.assertEquals(2, allParts.get(0).getChapters().get(1).getPosition());
        Assertions.assertEquals(3, allParts.get(0).getChapters().get(2).getPosition());

        verify(researchGroupRepository).findAllByNovelIdOrderByPosition(novel.getId());
    }

    @Test
    public void get_shouldReturnExistingPartWithSortedChapters() {
        Novel novel = NovelFactory.createMockNovel();
        Part part = createDummyPartWithChapters();

        when(researchGroupRepository.findById(part.getId())).thenReturn(Optional.of(part));

        Part resultPart = partService.get(novel.getId(), part.getId());
        Assertions.assertEquals(part, resultPart);
        Assertions.assertEquals(1, resultPart.getChapters().get(0).getPosition());
        Assertions.assertEquals(2, resultPart.getChapters().get(1).getPosition());
        Assertions.assertEquals(3, resultPart.getChapters().get(2).getPosition());

        verify(researchGroupRepository).findById(part.getId());
    }

    @Test
    public void get_shouldThrowErrorForNonExistingPart() {
        Novel novel = NovelFactory.createMockNovel();
        Part part = createDummyPartWithChapters();
        when(researchGroupRepository.findById(part.getId())).thenReturn(Optional.empty());
        Assertions.assertThrows(NotFoundException.class, () -> partService.get(novel.getId(), part.getId()));
    }

    @Test
    public void create_shouldCreateNewItemWithCorrectPosition() {
        Part part1 = PartFactory.createMockPart();
        part1.setPosition(508);

        Novel novel = NovelFactory.createMockNovel();
        Part part = PartFactory.createMockPart();
        when(novelRepository.findById(novel.getId())).thenReturn(Optional.of(novel));
        when(researchGroupRepository.findById(part.getId())).thenReturn(Optional.of(part));
        when(researchGroupRepository.save(part)).thenReturn(part);
        when(researchGroupRepository.findTopByNovelIdOrderByPositionDesc(novel.getId())).thenReturn(part1);

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
        when(researchGroupRepository.save(part)).thenReturn(part);
        when(researchGroupRepository.findById(part.getId())).thenReturn(Optional.of(part));

        Part savedPart = partService.update(novel.getId(), part);
        Assertions.assertEquals(savedPart, part);
        Assertions.assertEquals(novel, savedPart.getNovel());
    }

    @Test
    public void delete_shouldDeleteItemAndChildren() {
        Novel novel = NovelFactory.createMockNovel();
        Part part = createDummyPartWithChapters();
        when(researchGroupRepository.findById(part.getId())).thenReturn(Optional.of(part));

        partService.delete(novel.getId(), part.getId());
        verify(researchGroupRepository).deleteById(part.getId());
        verify(researchRepository).deleteAll(part.getChildren());
    }*/

    private List<ResearchGroup> createDummyParentsWithChildren() {
        ResearchGroup part = createDummyGroupWithChildren();
        ResearchGroup otherPart = ResearchGroupFactory.createMockGroup();
        return Arrays.asList(part, otherPart);
    }

    private ResearchGroup createDummyGroupWithChildren() {
        ResearchGroup part = new ResearchGroupBuilder()
                .withName(FactoryUtils.createRandomString())
                .withId(new Random().nextLong())
                .withPosition(new Random().nextInt()).build();

        for (int i = 0; i < 3; i++) {
            part.getChildren().add(new ResearchBuilder()
                    .withName(FactoryUtils.createRandomString())
                    .withId(new Random().nextLong()));
        }
        return part;
    }
}
