package de.wortomat.service;

import de.wortomat.model.Chapter;
import de.wortomat.model.ChapterTag;
import de.wortomat.model.CharacterTag;
import de.wortomat.repository.ChapterRepository;
import de.wortomat.repository.PositionAwareRepository;
import de.wortomat.repository.tags.ChapterTagRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import org.springframework.util.ObjectUtils;

import java.util.ArrayList;
import java.util.List;

@Service
public class ChapterService extends PositionAwareService<Chapter>{
    @Autowired
    ChapterRepository chapterRepository;

    @Autowired
    NovelService novelService;

    @Autowired
    ChapterTagRepository chapterTagRepository;

    public List<ChapterTag> getTags(Long novelId) {
        return this.chapterTagRepository.findAllByNovelIdOrderByNameAsc(novelId);
    }

    public ChapterTag createTag(Long novelId, ChapterTag tag) {
        tag.setNovel(novelService.get(novelId));
        return this.chapterTagRepository.save(tag);
    }

    @Override
    public PositionAwareRepository<Chapter, Long> getRepository() {
        return this.chapterRepository;
    }


}
