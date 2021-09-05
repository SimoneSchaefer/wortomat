package de.wortomat.service;

import de.wortomat.model.ChapterTag;
import de.wortomat.repository.TagRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

@Service
public class TagService {
    @Autowired
    NovelService novelService;

    @Autowired
    TagRepository tagRepository;

    public ChapterTag create(Long novelId, ChapterTag tag) {
        tag.setNovel(this.novelService.get(novelId));
        return this.tagRepository.save(tag);
    }

    public ChapterTag update(Long novelId, ChapterTag tag) {
        tag.setNovel(this.novelService.get(novelId));
        return this.tagRepository.save(tag);
    }

    public void delete(Long _novelId, Long chapterId) {
        this.tagRepository.deleteById(chapterId);
    }

}
