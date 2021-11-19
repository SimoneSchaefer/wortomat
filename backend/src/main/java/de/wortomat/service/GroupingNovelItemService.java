package de.wortomat.service;

import de.wortomat.exceptions.NotFoundException;
import de.wortomat.model.IGroupingNovelItem;
import de.wortomat.model.INovelItem;
import de.wortomat.repository.GroupingItemRepository;
import de.wortomat.repository.NovelItemRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.transaction.annotation.Transactional;

import java.util.Comparator;
import java.util.List;
import java.util.stream.Collectors;

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
    public List<T> moveChild(Long novelId, Long childId, Long newParentId, int newPosition) {
        S child = this.getChildRepository().findById(childId).orElseThrow(NotFoundException::new);

        if (child.getParent().getId().equals(newParentId)) {
            moveChildWithinParent(child, newPosition);
        } else {
            moveChildToOtherParent(child, newPosition, newParentId);
        }
        child.setPosition(newPosition);
        this.getChildRepository().save(child);
        return this.getParentRepository().findAllByNovelIdOrderByPosition(novelId);
    }

    private void moveChildToOtherParent(S child, int newPosition, Long newParentId) {
        T oldParent = this.getParentRepository().findById(child.getParent().getId()).orElseThrow(NotFoundException::new);
        T newParent = this.getParentRepository().findById(newParentId).orElseThrow(NotFoundException::new);

        oldParent.getChildren().remove(child);
        oldParent.getChildren().stream()
                .filter(otherChild -> otherChild.getPosition() >= child.getPosition())
                .forEach(otherChild -> otherChild.setPosition(otherChild.getPosition() - 1));

        newParent.getChildren().stream()
                .filter(otherChild -> otherChild.getPosition() >= newPosition)
                .forEach(otherChild -> otherChild.setPosition(otherChild.getPosition() + 1));
        (newParent.getChildren()).add(newPosition, child);
        child.setParent(newParent);
        this.getParentRepository().save(oldParent);
        this.getParentRepository().save(newParent);
    }

    private void moveChildWithinParent(S child, int newPosition) {
        boolean movedUp = child.getPosition() > newPosition;
        List<S> updatedChildren = movedUp ? moveChildUp(child, newPosition) : moveChildDown(child, newPosition); // TODO: fix generics confusion
        getChildRepository().saveAll(updatedChildren);
    }

    private List<S> moveChildUp(S child, int newPosition) {
        List<S> allConcernedChildren  = child.getParent().getChildren().stream()
                .filter(otherChild -> otherChild.getPosition() >= newPosition)
                .collect(Collectors.toList());
        allConcernedChildren.forEach(otherChild -> otherChild.setPosition(otherChild.getPosition() + 1));
        return allConcernedChildren;
    }

    private List<S>  moveChildDown(S child, int newPosition) {
        List<S> allConcernedChildren  = child.getParent().getChildren().stream()
                .filter(otherChild -> otherChild.getPosition() > child.getPosition() && otherChild.getPosition() <= newPosition)
                .collect(Collectors.toList());
        allConcernedChildren.forEach(otherChild -> otherChild.setPosition(otherChild.getPosition() - 1));
        return allConcernedChildren;
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
