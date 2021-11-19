package de.wortomat.service;

import de.wortomat.model.IGroupingNovelItem;
import de.wortomat.model.INovelItem;
import de.wortomat.repository.NovelItemRepository;

import java.util.List;

public abstract class NovelItemService<T extends IGroupingNovelItem, S extends INovelItem> {
    abstract GroupingItemService<T, S> getParentService();
    abstract NovelItemRepository<S, Long> getRepository();
    abstract S getMaxPositionItem(Long parentId);

    public INovelItem create(Long novelId, Long partId, S chapter) {
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
