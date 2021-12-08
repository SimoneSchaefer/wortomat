package de.wortomat.service.groupingNovelItem;

import de.wortomat.exceptions.NotFoundException;
import de.wortomat.model.IGroupingNovelItem;
import de.wortomat.model.INovelItem;
import de.wortomat.repository.GroupingItemRepository;
import de.wortomat.repository.NovelItemRepository;
import de.wortomat.service.NovelService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.transaction.annotation.Transactional;

import java.util.Comparator;
import java.util.List;

public abstract class GroupingNovelItemService<T extends IGroupingNovelItem<S>, S extends INovelItem<T>> {

    protected abstract GroupingItemRepository<T, Long> getParentRepository();
    protected abstract NovelItemRepository<S> getChildRepository();

    @Autowired
    protected NovelService novelService;

    public List<T> get(Long novelId) {
        List<T> allParts = this.getParentRepository().findAllByNovelIdOrderByPosition(novelId);
        for (T parent : allParts) {
            sortChildren(parent);
        }
        return allParts;
    }

    public T get(Long novelId, Long itemId) {
        T parent = this.getParentRepository().findById(itemId).orElseThrow(NotFoundException::new);
        sortChildren(parent);
        return parent;
    }

    public T create(Long novelId, T positionAware) {
        positionAware.setNovel(this.novelService.get(novelId));
        positionAware.setPosition((getMaxPosition(novelId)));

        T item = this.getParentRepository().save(positionAware);
        return get(novelId, item.getId());
    }

    public T update(Long novelId, T positionAware) {
        positionAware.setNovel(this.novelService.get(novelId));
        this.getParentRepository().save(positionAware);
        return this.get(novelId, positionAware.getId());
    }

    public void delete(Long _novelId, Long parentId) {
        this.getChildRepository().deleteAll(this.get(_novelId, parentId).getChildren());
        this.getParentRepository().deleteById(parentId);
    }

    public void deleteAll(Long novelId) {
        List<T> allItems = this.getParentRepository().findAllByNovelIdOrderByPosition(novelId);
        this.getParentRepository().deleteAll(allItems);
    }


    @Transactional
    public List<T> moveParent(Long novelId, Long parentId, Integer oldPosition, Integer newPosition) {
        List<T> allParents = this.getParentRepository().findAllByNovelIdOrderByPosition(novelId);
        T parentToMove = this.getParentRepository().findById(parentId).orElseThrow(NotFoundException::new);
        allParents.remove(parentToMove);
        allParents.add(newPosition, parentToMove);

        for (int i = 0; i < allParents.size(); i++) {
            allParents.get(i).setPosition(i);
        }
        getParentRepository().saveAll(allParents);
        return this.getParentRepository().findAllByNovelIdOrderByPosition(novelId);
    }


    @Transactional
    public List<T> moveChild(Long novelId, Long childId, Long newParentId, int newPosition) {
        S child = this.getChildRepository().findById(childId).orElseThrow(NotFoundException::new);
        if (child.getParent().getId().equals(newParentId)) {
            moveChildWithinParent(child, newPosition);
        } else {
            moveChildToOtherParent(child, newPosition, newParentId);
        }
        return this.getParentRepository().findAllByNovelIdOrderByPosition(novelId);
    }

    private void moveChildToOtherParent(S child, int newPosition, Long newParentId) {
        T oldParent = this.getParentRepository().findById(child.getParent().getId()).orElseThrow(NotFoundException::new);
        T newParent = this.getParentRepository().findById(newParentId).orElseThrow(NotFoundException::new);
        oldParent.getChildren().remove(child);
        newParent.getChildren().add(newPosition, child);
        updatePositions(oldParent.getChildren());
        updatePositions(newParent.getChildren());
        this.getParentRepository().save(oldParent);
        this.getParentRepository().save(newParent);
    }

    private void moveChildWithinParent(S child, int newPosition) {
        List<S> children = child.getParent().getChildren();
        children.remove(child);
        children.add(newPosition, child);
        updatePositions(children);
    }

    private void updatePositions(List<S> novelItems) {
        for (int i = 0; i < novelItems.size(); i++) {
            novelItems.get(i).setPosition(i);
        }
        this.getChildRepository().saveAll(novelItems);
    }

    private int getMaxPosition(Long novelId) {
        T maxPosition = this.getParentRepository().findTopByNovelIdOrderByPositionDesc(novelId);
        if (maxPosition == null) {
            return 0;
        }
        return maxPosition.getPosition() + 1;
    }

    private void sortChildren(T parent) {
        parent.getChildren().sort(Comparator.comparing(INovelItem::getPosition));
    }
}
