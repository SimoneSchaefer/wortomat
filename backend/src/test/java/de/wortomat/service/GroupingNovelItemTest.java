package de.wortomat.service;

import de.wortomat.factories.FactoryUtils;
import de.wortomat.model.*;
import de.wortomat.repository.GroupingItemRepository;
import de.wortomat.repository.NovelRepository;
import de.wortomat.repository.ResearchGroupRepository;
import de.wortomat.repository.ResearchRepository;
import org.junit.ClassRule;
import org.junit.Rule;
import org.junit.Test;
import org.junit.runner.RunWith;
import org.junit.runners.Parameterized;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.boot.test.mock.mockito.MockBean;
import org.springframework.context.ApplicationContext;
import org.springframework.test.context.junit4.rules.SpringClassRule;
import org.springframework.test.context.junit4.rules.SpringMethodRule;
import org.springframework.test.web.servlet.MockMvc;

import java.lang.reflect.InvocationTargetException;
import java.lang.reflect.Method;
import java.util.Arrays;
import java.util.Random;

import static org.mockito.Mockito.spy;
import static org.mockito.Mockito.when;



@SpringBootTest(webEnvironment = SpringBootTest.WebEnvironment.MOCK)
@AutoConfigureMockMvc
@RunWith(Parameterized.class)
public class GroupingNovelItemTest {
    @ClassRule
    public static final SpringClassRule SPRING_CLASS_RULE = new SpringClassRule();

    @Rule
    public final SpringMethodRule springMethodRule = new SpringMethodRule();

    @Autowired
    private MockMvc mockMvc;

    @MockBean
    private NovelRepository novelRepository;

    @Autowired
    private ApplicationContext context;

    @Autowired
    private NovelService novelService;

    private Class<NovelItemService<?,?>> novelItemService;
    private Class<GroupingItemService<?,?>> groupingItemService;
    private Class<GroupingItemRepository<?,?>> groupingItemRepository;
    private Cloneable groupBuilder;
    private Cloneable childBuilder;

    public GroupingNovelItemTest(
            Class<GroupingItemService<?,?>> groupingItemService,
            Class<GroupingItemRepository<?,?>> groupingItemRepository,
            Class<NovelItemService<?,?>> novelItemService,
            Cloneable groupBuilder,
            Cloneable childBuilder) {
        this.novelItemService = novelItemService;
        this.groupingItemService = groupingItemService;
        this.groupingItemRepository = groupingItemRepository;
        this.groupBuilder = groupBuilder;
        this.childBuilder = childBuilder;
    }

    @Parameterized.Parameters(/*name = "{index}: {0}, GroupService: {1}, GroupRepository: {2}, ChildRepository: {3}, GroupBuilder: {4}, ChildBuilder: {5} "*/)
    public static Iterable<Object[]> data() {
        return Arrays.asList(new Object[][]{
                { ResearchGroupService.class, ResearchGroupRepository.class, ResearchRepository.class, new ResearchGroupBuilder(), new ResearchBuilder() },
        });
    }


    private GroupingItemRepository groupingItemRepository() {

        return context.getBean(this.groupingItemRepository);
    }


    @Test
    public void test_parameterized() throws NoSuchMethodException, InvocationTargetException, IllegalAccessException {
        Novel novel = createMockNovel();
        GroupingNovelItem group = buildItemWithChildren();
        GroupingNovelItem group2 = buildItemWithChildren();

        GroupingItemRepository bla = context.getBean(this.groupingItemRepository);
        GroupingItemRepository blubb = spy(bla);
        when(blubb.findAllByNovelIdOrderByPosition(novel.getId())).thenReturn(Arrays.asList(group, group2));

        /*
        when(researchGroupRepository.findAllByNovelIdOrderByPosition(novel.getId())).thenReturn(allParents);

        List<Part> resultParts = researchGroup.get(novel.getId());
        Assertions.assertEquals(allParts, resultParts);
        Assertions.assertEquals(1, allParts.get(0).getChapters().get(0).getPosition());
        Assertions.assertEquals(2, allParts.get(0).getChapters().get(1).getPosition());
        Assertions.assertEquals(3, allParts.get(0).getChapters().get(2).getPosition());

        verify(researchGroupRepository).findAllByNovelIdOrderByPosition(novel.getId());*/
    }

    /*@Test
    public void get_shouldReturnAllGroupsWithSortedChildren() {
        Novel novel = new NovelBuilder()
                .withId(new Random().nextLong())
                .withName((FactoryUtils.createRandomString()))
                .withSummary(FactoryUtils.createRandomString()).build();
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


    private Object buildItem(Object groupBuilder) throws NoSuchMethodException, InvocationTargetException, IllegalAccessException {
        Method nameMethod = groupBuilder.getClass().getMethod("withName", String.class);
        Method idMethod = groupBuilder.getClass().getMethod("withId", Long.class);
        Method positionMethod = groupBuilder.getClass().getMethod("withPosition", Integer.class);
        Method buildMethod = groupBuilder.getClass().getMethod("build");

        Object builder = nameMethod.invoke(groupBuilder, FactoryUtils.createRandomString());
        builder = idMethod.invoke(builder, new Random().nextLong());
        builder = positionMethod.invoke(builder, new Random().nextInt());
        return buildMethod.invoke(builder);
    }

    private GroupingNovelItem buildItemWithChildren() throws InvocationTargetException, NoSuchMethodException, IllegalAccessException {
        GroupingNovelItem group = (GroupingNovelItem) buildItem(this.groupBuilder);
        NovelItem child1 = (NovelItem) buildItem(this.childBuilder);
        NovelItem child2 = (NovelItem) buildItem(this.childBuilder);
        NovelItem child3 = (NovelItem) buildItem(this.childBuilder);

        Method positionMethod = NovelItem.class.getMethod("setPosition", Integer.class);
        positionMethod.invoke(child1, 3);
        positionMethod.invoke(child2, 1);
        positionMethod.invoke(child3, 2);

        group.getChildren().addAll(Arrays.asList(child1, child2, child3));
        return group;
    }


    private Novel createMockNovel() {
        return new NovelBuilder()
                .withId(new Random().nextLong())
                .withName((FactoryUtils.createRandomString()))
                .withSummary(FactoryUtils.createRandomString()).build();
    }

   /* private List<ResearchGroup> createDummyParentsWithChildren() {
        ResearchGroup part = createDummyGroupWithChildren();
        ResearchGroup otherPart = ResearchGroupFactory.createMockGroup();
        return Arrays.asList(part, otherPart);
    }*/
}
