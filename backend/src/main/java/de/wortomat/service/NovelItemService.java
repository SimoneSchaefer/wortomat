package de.wortomat.service;

import de.wortomat.model.Chapter;
import de.wortomat.model.GroupingNovelItem;
import de.wortomat.model.NovelItem;
import de.wortomat.repository.NovelItemRepository;

import java.util.List;

public abstract class NovelItemService<T extends GroupingNovelItem, S extends NovelItem> {
    abstract GroupingItemService<T, S> getParentService();
    abstract NovelItemRepository<S, Long> getRepository();
    abstract S getMaxPositionItem(Long parentId);

    public NovelItem create(Long novelId, Long partId, S chapter) {
        return ensureParent(chapter, novelId, partId);
    }

    public S update(Long novelId, Long partId, S chapter) {
        return ensureParent(chapter, novelId, partId);
    }

    public void delete(Long _novelId, Long chapterId) {
        this.getRepository().deleteById(chapterId);
    }


    private S ensureParent(S chapter, Long novelId, Long partId) {
        T part = getParentService().get(novelId, partId);
        chapter.setParent(part);
        if (chapter.getId() == null) {
            chapter.setPosition((getMaxPosition(part.getId())));
        }
        this.getRepository().save(chapter);
        ((List)part.getChildren()).add(chapter);
        getParentService().update(novelId, part);
        return chapter;
    }


    private int getMaxPosition(Long partId) {
        S maxPosition = this.getMaxPositionItem(partId);
        if (maxPosition == null) {
            return 0;
        }
        return maxPosition.getPosition() + 1;
    }

}