package de.wortomat.service;

import de.wortomat.model.Chapter;
import de.wortomat.model.Part;
import de.wortomat.model.PositionAware;
import de.wortomat.repository.ChapterRepository;
import de.wortomat.repository.PartsRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.ArrayList;
import java.util.Comparator;
import java.util.List;
import java.util.stream.Collectors;

@Service
public class PartService {
    @Autowired
    private NovelService novelService;

    @Autowired
    private PartsRepository partsRepository;
    @Autowired
    private ChapterRepository chapterRepository;


    public List<Part> get(Long novelId) {
        List<Part> allParts = this.getRepository().findAllByNovelIdOrderByPosition(novelId);
        for (Part part : allParts) {
            part.getChapters().sort(Comparator.comparing(Chapter::getPosition));
        }
        return allParts;
    }

    public Part get(Long _novelId, Long itemItem) {
        return this.getRepository().findById(itemItem).get();
    }

    public Part create(Long novelId, Part positionAware) {
        positionAware.setNovel(this.novelService.get(novelId));
        positionAware.setPosition((getMaxPosition(novelId)));
        return this.getRepository().save(positionAware);
    }

    public Part update(Long novelId, Part positionAware) {
        positionAware.setNovel(this.novelService.get(novelId));
        return this.getRepository().save(positionAware);
    }
    public void delete(Long _novelId, Long chapterId) {
        this.getRepository().deleteById(chapterId);
    }

    public int getMaxPosition(Long novelId) {
        PositionAware maxPosition = this.getRepository().findTopByNovelIdOrderByPositionDesc(novelId);
        if (maxPosition == null) {
            return 0;
        }
        return maxPosition.getPosition() + 1;
    }


    @Transactional
    public List<Part> moveChild(Long novelId, Long childId, Long newParentId, int newPosition) {
        Chapter chapter = this.chapterRepository.findById(childId).get();

        if (chapter.getPart().getId().equals(newParentId)) { // chapter has been moved within its parent
            moveChildWithinParent(chapter, newPosition);
        } else {
            Part oldParent = chapter.getPart();
            Part newParent = this.partsRepository.findById(newParentId).get();

            // remove from old parent: all following chapters need to move one up
            oldParent.getChapters().remove(chapter);
            oldParent.getChapters().stream()
                    .filter(chapter1 -> chapter1.getPosition() >= chapter.getPosition())
                    .forEach(chapter1 -> chapter1.setPosition(chapter1.getPosition() - 1));

            // add to new parent: all chapters behind the new chapter must move one down
            newParent.getChapters().stream()
                    .filter(chapter1 -> chapter1.getPosition() >= newPosition)
                    .forEach(chapter1 -> chapter1.setPosition(chapter1.getPosition() + 1));
            newParent.getChapters().add(newPosition, chapter);
            chapter.setPart(newParent);
            this.partsRepository.save(oldParent);
            this.partsRepository.save(newParent);
        }
        chapter.setPosition(newPosition);
        this.chapterRepository.save(chapter);
        return this.getRepository().findAllByNovelIdOrderByPosition(novelId);
    }

    public List<Part> updatePositions(Long novelId, List<Long> updatedPositions) {
        List<Part> newPositions = new ArrayList<>(updatedPositions.size());
        for (int positionCounter = 0; positionCounter < updatedPositions.size(); positionCounter++) {
            Part positionAware = this.getRepository().findById((updatedPositions.get(positionCounter))).get();
            positionAware.setPosition(positionCounter);
            newPositions.add(positionAware);
        }
        this.getRepository().saveAll(newPositions);
        return this.getRepository().findAllByNovelIdOrderByPosition(novelId);
    }


    private void moveChildWithinParent(Chapter chapter, int newPosition) {
        boolean movedUp = chapter.getPosition() > newPosition;
        if (movedUp) {
            this.moveChildUp(chapter, newPosition);
        } else {
            moveChildDown(chapter, newPosition);
        }
    }

    private void moveChildUp(Chapter chapter, int newPosition) {
        //moved up within the part -> increase position AFTER new position + 1
        List<Chapter> allConcernedChapters  = chapter.getPart().getChapters().stream()
                .filter(chapter1 -> chapter1.getPosition() >= newPosition)
                .collect(Collectors.toList());
        allConcernedChapters.forEach(chapter1 -> chapter1.setPosition(chapter1.getPosition() + 1));
        this.chapterRepository.saveAll(allConcernedChapters);
    }

    private void moveChildDown(Chapter chapter, int newPosition) {
        // moved down within the part -> move all chapters that are BEFORE the chapter NOW 1 position up
        List<Chapter> allConcernedChapters  = chapter.getPart().getChapters().stream()
                .filter(chapter1 -> chapter1.getPosition() > chapter.getPosition() && chapter1.getPosition() <= newPosition) // chapters that were AFTER the chapter before and now are before
                .collect(Collectors.toList());
        allConcernedChapters.forEach(chapter1 -> chapter1.setPosition(chapter1.getPosition() - 1));
        this.chapterRepository.saveAll(allConcernedChapters);
    }

    private PartsRepository getRepository() {
        return this.partsRepository;
    }

}
