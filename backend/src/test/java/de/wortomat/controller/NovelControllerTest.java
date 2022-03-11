package de.wortomat.controller;

import de.wortomat.exceptions.NotFoundException;
import de.wortomat.factories.FactoryUtils;
import de.wortomat.factories.NovelFactory;
import de.wortomat.model.Novel;
import de.wortomat.service.NovelService;
import org.junit.Ignore;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.boot.test.mock.mockito.MockBean;
import org.springframework.http.MediaType;
import org.springframework.test.web.servlet.MockMvc;

import java.util.Arrays;
import java.util.Collections;

import static org.hamcrest.Matchers.containsString;
import static org.hamcrest.Matchers.equalTo;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.*;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.content;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

@SpringBootTest
@AutoConfigureMockMvc
public class NovelControllerTest {

    @Autowired
    private MockMvc mockMvc;

    @MockBean
    private NovelService novelService;

    @Test
    public void list_ShouldReturnEmptyListWhenNoNovelsExist() throws Exception {
        when(novelService.list()).thenReturn(Collections.emptyList());

        this.mockMvc.perform(get("/novels/")).
                andExpect(status().isOk()).
                andExpect(content().string(equalTo("[]")));
    }
    @Test
    public void list_ShouldReturnExistingNovels() throws Exception {
        Novel novel = NovelFactory.createMockNovel();
        Novel other_novel = NovelFactory.createMockNovel();
        when(novelService.list()).thenReturn(Arrays.asList(novel, other_novel));

        this.mockMvc.perform(get("/novels/")).
                andExpect(status().isOk()).
                andExpect(content().string(containsString(expectedResponseForNovel(novel)))).
                andExpect(content().string(containsString(expectedResponseForNovel(other_novel))));
    }

    @Test
    public void get_shouldReturnExistingNovel() throws Exception {
        Novel novel = NovelFactory.createMockNovel();
        when(novelService.get(novel.getId())).thenReturn(novel);

        this.mockMvc.perform(get(String.format("/novels/%d", novel.getId()))).
                andExpect(status().isOk()).
                andExpect(content().string(containsString(expectedResponseForNovel(novel))));
    }

    @Test
    public void get_shouldReturn404ForNonExistingNovel() throws Exception {
        Novel novel = NovelFactory.createMockNovel();
        when(novelService.get(novel.getId())).thenThrow(NotFoundException.class);

        this.mockMvc.perform(get(String.format("/novels/%d", novel.getId()))).
                andExpect(status().isNotFound());
    }

    @Test
    public void delete_shouldDeleteNovel() throws Exception {
        Novel novel = NovelFactory.createMockNovel();
        this.mockMvc.perform(delete(String.format("/novels/%d", novel.getId()))).
                andExpect(status().isAccepted());

        verify(novelService).delete(novel.getId());
    }

    @Test
    public void create_shouldSaveAndReturnNovel() throws Exception {
        Novel novel = NovelFactory.createMockNovel();
        when(novelService.create(novel)).thenReturn(novel);
        this.mockMvc.perform(
                post("/novels/").contentType(MediaType.APPLICATION_JSON).content(FactoryUtils.itemToJSON(novel))).
                andExpect(status().isCreated()).
                andExpect(content().string(containsString(expectedResponseForNovel(novel))));
        verify(novelService).create(novel);
    }

    @Test
    public void update_shouldSaveAndReturnNovel() throws Exception {
        Novel novel = NovelFactory.createMockNovel();
        when(novelService.update(novel)).thenReturn(novel);
        this.mockMvc.perform(
                put("/novels/").contentType(MediaType.APPLICATION_JSON).content(FactoryUtils.itemToJSON(novel))).
                andExpect(status().isOk()).
                andExpect(content().string(containsString(expectedResponseForNovel(novel))));
        verify(novelService).update(novel);
    }

    private String expectedResponseForNovel(Novel novel) {
        return String.format("{\"id\":%d," +
                "\"name\":\"%s\"," +
                "\"summary\":\"%s\"," +
                "\"position\":%d," +
                "\"author\":\"%s\"," +
                "\"isTrash\":false}",
                novel.getId(), novel.getName(), novel.getSummary(), novel.getPosition(), novel.getAuthor());
    }

}
