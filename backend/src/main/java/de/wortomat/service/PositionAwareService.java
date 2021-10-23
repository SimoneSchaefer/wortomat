package de.wortomat.service;

import de.wortomat.model.NovelItemTag;
import de.wortomat.model.PositionAware;
import de.wortomat.repository.PositionAwareRepository;
import org.springframework.beans.factory.annotation.Autowired;

import java.util.ArrayList;
import java.util.Comparator;
import java.util.List;

public abstract class PositionAwareService<T extends PositionAware> {
    @Autowired
    private NovelService novelService;

    public abstract PositionAwareRepository<T,Long> getRepository();

    public List<T> get(Long novelId) {
        List<T> result = this.getRepository().findAllByNovelIdOrderByPosition(novelId);
        for (T item : result) {
            item.getTags().sort(Comparator.comparing(NovelItemTag::getName));
        }
        return result;
    }

    public T get(Long _novelId, Long itemItem) {
        return this.getRepository().findById(itemItem).get();
    }

    public T create(Long novelId, T positionAware) {
        positionAware.setNovel(this.novelService.get(novelId));
        positionAware.setPosition((getMaxPosition(novelId)));
        return this.getRepository().save(positionAware);
    }

    public T update(Long novelId, T positionAware) {
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

    public List<T> updatePositions(Long novelId, List<Long> updatedPositions) {
        List<T> newPositions = new ArrayList<>(updatedPositions.size());
        for (int positionCounter = 0; positionCounter < updatedPositions.size(); positionCounter++) {
            T positionAware = this.getRepository().findById((updatedPositions.get(positionCounter))).get();
            positionAware.setPosition(positionCounter);
            newPositions.add(positionAware);
        }
        this.getRepository().saveAll(newPositions);
        return this.getRepository().findAllByNovelIdOrderByPosition(novelId);
    }
}
