package de.wortomat.service;

import de.wortomat.model.Chapter;
import de.wortomat.model.Tag;
import de.wortomat.repository.TagRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

@Service
public class TagService {
    @Autowired
    NovelService novelService;

    @Autowired
    TagRepository tagRepository;

    public Tag create(Long novelId, Tag tag) {
        tag.setNovel(this.novelService.get(novelId));
        return this.tagRepository.save(tag);
    }

    public Tag update(Long novelId, Tag tag) {
        tag.setNovel(this.novelService.get(novelId));
        return this.tagRepository.save(tag);
    }

    public void delete(Long _novelId, Long chapterId) {
        this.tagRepository.deleteById(chapterId);
    }

}
