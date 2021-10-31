package de.wortomat.service;

import de.wortomat.model.Chapter;
import de.wortomat.model.Part;
import de.wortomat.model.PositionAware;
import de.wortomat.repository.ChapterRepository;
import de.wortomat.repository.PartsRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import java.util.ArrayList;
import java.util.List;

@Service
public class PartService {
    @Autowired
    private NovelService novelService;

    @Autowired
    private PartsRepository partsRepository;
    @Autowired
    private ChapterRepository chapterRepository;


    public List<Part> get(Long novelId) {
        List<Part> parts = this.getRepository().findAllByNovelIdOrderByPosition(novelId);
        /*for (Part part : parts) {
            System.out.println(part);
            List chapters = part.getChapters();
            System.out.println(chapters);

            List<Chapter> manual = chapterRepository.findAllByPartId(part.getId());
            System.out.println(manual);
        }*/
        return parts;

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

    private PartsRepository getRepository() {
        return this.partsRepository;
    }

}
