package de.wortomat.service;

import de.wortomat.exceptions.NotFoundException;
import de.wortomat.factories.NovelFactory;
import de.wortomat.model.Novel;
import de.wortomat.repository.NovelRepository;
import org.junit.jupiter.api.Assertions;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.boot.test.mock.mockito.MockBean;
import org.springframework.test.web.servlet.MockMvc;

import java.util.Arrays;
import java.util.List;

import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

@SpringBootTest
@AutoConfigureMockMvc
public class NovelServiceTest {

    @Autowired
    private MockMvc mockMvc;

    @Autowired
    private NovelService novelService;

    @MockBean
    private NovelRepository novelRepository;


    @Test
    public void get_returnsNovelIfFound() {
        Novel novel = NovelFactory.createMockNovel();
        when(novelRepository.findById(any())).thenReturn(java.util.Optional.of(novel));
        Assertions.assertEquals(novel, novelService.get(123L));
    }

    @Test
    public void get_throwsNotFoundExceptionWhenNovelDoesNotExist() {
        when(novelRepository.findById(any())).thenReturn(java.util.Optional.empty());
        Assertions.assertThrows(NotFoundException.class, () -> novelService.get(123L));
    }

    @Test
    public void list_returnsOrderedNovels() {
        Novel novel = NovelFactory.createMockNovel();
        Novel otherNovel = NovelFactory.createMockNovel();
        List<Novel> allNovels = Arrays.asList(novel, otherNovel);
        when(novelRepository.findByOrderByPositionAsc()).thenReturn(allNovels);
        Assertions.assertEquals(allNovels, novelService.list());
        verify(novelRepository).findByOrderByPositionAsc();
    }

    @Test
    public void create_savesAndReturnsNovel() {
        Novel novel = NovelFactory.createMockNovel();
        when(novelRepository.save(novel)).thenReturn(novel);
        Assertions.assertEquals(novel, novelService.create(novel));
        verify(novelRepository).save(novel);
    }

    @Test
    public void update_savesAndReturnsNovel() {
        Novel novel = NovelFactory.createMockNovel();
        when(novelRepository.save(novel)).thenReturn(novel);
        Assertions.assertEquals(novel, novelService.update(novel));
        verify(novelRepository).save(novel);
    }

    @Test
    public void delete_deletesNovel() {
        Novel novel = NovelFactory.createMockNovel();
        novelService.delete(novel.getId());
        verify(novelRepository).deleteById(novel.getId());
    }
}
