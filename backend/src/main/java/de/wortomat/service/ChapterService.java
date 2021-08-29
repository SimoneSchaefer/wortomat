package de.wortomat.service;

import de.wortomat.model.Chapter;
import de.wortomat.repository.ChapterRepository;
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
    NovelService novelService;

    public List<Chapter> get(Long novelId) {
        return this.chapterRepository.findAllByNovelIdOrderByPosition(novelId);
    }

    public Chapter create(Long novelId, Chapter chapter) {
        chapter.setNovel(this.novelService.get(novelId));
        chapter.setPosition((getMaxPosition(novelId)));
        return this.chapterRepository.save(chapter);
    }

    public Chapter update(Long novelId, Chapter chapter) {
        chapter.setNovel(this.novelService.get(novelId));
        return this.chapterRepository.save(chapter);
    }
    public void delete(Long _novelId, Long chapterId) {
        this.chapterRepository.deleteById(chapterId);
    }

    public int getMaxPosition(Long novelId) {
        Chapter maxPosition = this.chapterRepository.findTopByNovelIdOrderByPositionDesc(novelId);
        if (maxPosition == null) {
            return 0;
        }
        return maxPosition.getPosition() + 1;
    }

    public List<Chapter> updatePositions(Long novelId, List<Long> updatedPositions) {
        List<Chapter> newPositions = new ArrayList<>(updatedPositions.size());
        for (int positionCounter = 0; positionCounter < updatedPositions.size(); positionCounter++) {
            Chapter chapter = this.chapterRepository.findById((updatedPositions.get(positionCounter))).get();
            chapter.setPosition(positionCounter);
            newPositions.add(chapter);
        }
        this.chapterRepository.saveAll(newPositions);
        return this.chapterRepository.findAllByNovelIdOrderByPosition(novelId);
    }
}
