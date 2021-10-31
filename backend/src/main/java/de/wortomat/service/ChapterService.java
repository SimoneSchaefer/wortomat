package de.wortomat.service;

import de.wortomat.model.*;
import de.wortomat.repository.ChapterRepository;
import de.wortomat.repository.PositionAwareRepository;
import de.wortomat.repository.tags.ChapterTagRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import org.springframework.util.ObjectUtils;

import java.util.ArrayList;
import java.util.List;

@Service
public class ChapterService {
    @Autowired
    ChapterRepository chapterRepository;

    @Autowired
    PartService partService;

    @Autowired
    ChapterTagRepository chapterTagRepository;

    public Chapter create(Long novelId, Long partId, Chapter chapter) {
        return ensureParent(chapter, novelId, partId);
    }

    public Chapter update(Long novelId, Long partId, Chapter chapter) {
        return ensureParent(chapter, novelId, partId);
    }

    private Chapter ensureParent(Chapter chapter, Long novelId, Long partId) {
        Part part = partService.get(novelId, partId);
        chapter.setPart(part);
        if (chapter.getId() == null) {
            chapter.setPosition((getMaxPosition(part.getId())));
        }
        this.getRepository().save(chapter);
        part.getChapters().add(chapter);
        partService.update(novelId, part);
        return chapter;
    }

    public void delete(Long _novelId, Long chapterId) {
        this.getRepository().deleteById(chapterId);
    }

    public int getMaxPosition(Long partId) {
        PositionAware maxPosition = this.getRepository().findTopByPartIdOrderByPositionDesc(partId);
        if (maxPosition == null) {
            return 0;
        }
        return maxPosition.getPosition() + 1;
    }

    /*public List<T> updatePositions(Long novelId, List<Long> updatedPositions) {
        List<T> newPositions = new ArrayList<>(updatedPositions.size());
        for (int positionCounter = 0; positionCounter < updatedPositions.size(); positionCounter++) {
            T positionAware = this.getRepository().findById((updatedPositions.get(positionCounter))).get();
            positionAware.setPosition(positionCounter);
            newPositions.add(positionAware);
        }
        this.getRepository().saveAll(newPositions);
        return this.getRepository().findAllByNovelIdOrderByPosition(novelId);
    }*/

    public List<ChapterTag> getTags(Long novelId) {
        return this.chapterTagRepository.findAllByNovelIdOrderByNameAsc(novelId);
    }

    public ChapterTag createTag(Long novelId, ChapterTag tag) {
        // tag.setNovel(novelService.get(novelId));
        return this.chapterTagRepository.save(tag);
    }

    public ChapterRepository getRepository() {
        return this.chapterRepository;
    }


}
