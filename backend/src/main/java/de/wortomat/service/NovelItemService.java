package de.wortomat.service;

import de.wortomat.model.IGroupingNovelItem;
import de.wortomat.model.INovelItem;
import de.wortomat.repository.NovelItemRepository;

import java.util.List;

public abstract class NovelItemService<T extends IGroupingNovelItem<S>, S extends INovelItem<T>> {

    abstract GroupingNovelItemService<T, S> getParentService();
    abstract NovelItemRepository<S> getRepository();

    public S create(Long novelId, Long partId, S chapter) {
        return prepareAndSave(chapter, novelId, partId);
    }

    public S update(Long novelId, Long partId, S chapter) {
        return prepareAndSave(chapter, novelId, partId);
    }

    public void delete(Long _novelId, Long chapterId) {
        this.getRepository().deleteById(chapterId);
    }

    private S prepareAndSave(S child, Long novelId, Long parentId) {
        T parent = getParentService().get(novelId, parentId);
        child.setParent(parent);
        ensurePosition(child, novelId, parentId);
        return save(novelId, child, parent);
    }

    private S save(Long novelId, S child, T parent) {
        this.getRepository().save(child);

        parent.getChildren().add(child);
        getParentService().update(novelId, parent);
        return child;
    }

    private void ensurePosition(S child, Long novelId, Long parentId) {
        if (child.getId() == null) {
            child.setPosition((getMaxPosition(novelId, parentId)));
        }
    }

    private int getMaxPosition(Long novelId, Long partId) {
        S maxPosition = this.getMaxPositionItem(novelId, partId);
        if (maxPosition == null) {
            return 0;
        }
        return maxPosition.getPosition() + 1;
    }

    private S getMaxPositionItem(Long novelId, Long parentId) {
        T parent = getParentService().get(novelId, parentId);
        List<S> children = parent.getChildren();
        if (children.size() > 0) {
            return children.get(children.size() - 1);
        }
        return null;
    }
}
