package de.wortomat.service;

import de.wortomat.exceptions.NotFoundException;
import de.wortomat.model.GroupingNovelItem;
import de.wortomat.model.INovelItem;
import de.wortomat.repository.GroupingItemRepository;
import de.wortomat.repository.NovelItemRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.transaction.annotation.Transactional;

import java.util.Comparator;
import java.util.List;
import java.util.stream.Collectors;

public abstract class GroupingItemService <T extends GroupingNovelItem, S extends INovelItem> {
    protected abstract GroupingItemRepository<T, Long> getParentRepository();
    protected abstract NovelItemRepository<S, Long> getChildRepository();

    @Autowired
    protected NovelService novelService;

    public List<T> get(Long novelId) {
        List<T> allParts = this.getParentRepository().findAllByNovelIdOrderByPosition(novelId);
        for (GroupingNovelItem part : allParts) {
            part.getChildren().sort(Comparator.comparing(INovelItem::getPosition));
        }
        return allParts;
    }

    public T get(Long novelId, Long itemItem) {
        T item = this.getParentRepository().findById(itemItem).orElseThrow(NotFoundException::new);
        item.getChildren().sort(Comparator.comparing(INovelItem::getPosition));
        return item;
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
        this.getChildRepository().deleteAll((List)this.get(_novelId, parentId).getChildren());
        this.getParentRepository().deleteById(parentId);
    }

    public void deleteAll(Long novelId) {
        List<T> allItems = this.getParentRepository().findAllByNovelIdOrderByPosition(novelId);
        this.getParentRepository().deleteAll(allItems);
    }


    @Transactional
    public List<T> moveChild(Long novelId, Long childId, Long newParentId, int newPosition) {
        S child = this.getChildRepository().findById(childId).get();

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
        T oldParent = this.getParentRepository().findById(child.getParent().getId()).get();
        T newParent = this.getParentRepository().findById(newParentId).get();

        oldParent.getChildren().remove(child);
        oldParent.getChildren().stream()
                .filter(otherChild -> otherChild.getPosition() >= child.getPosition())
                .forEach(otherChild -> otherChild.setPosition(otherChild.getPosition() - 1));

        newParent.getChildren().stream()
                .filter(otherChild -> otherChild.getPosition() >= newPosition)
                .forEach(otherChild -> otherChild.setPosition(otherChild.getPosition() + 1));
        ((List)newParent.getChildren()).add(newPosition, child); // TODO: fix generics confusion
        child.setParent(newParent);
        this.getParentRepository().save(oldParent);
        this.getParentRepository().save(newParent);
    }

    private void moveChildWithinParent(S child, int newPosition) {
        boolean movedUp = child.getPosition() > newPosition;
        List updatedChildren = movedUp ? moveChildUp(child, newPosition) : moveChildDown(child, newPosition); // TODO: fix generics confusion
        getChildRepository().saveAll(updatedChildren);
    }

    private List<? extends INovelItem> moveChildUp(S child, int newPosition) {
        List<? extends INovelItem> allConcernedChildren  = child.getParent().getChildren().stream()
                .filter(otherChild -> otherChild.getPosition() >= newPosition)
                .collect(Collectors.toList());
        allConcernedChildren.forEach(otherChild -> otherChild.setPosition(otherChild.getPosition() + 1));
        return allConcernedChildren;
    }

    private List<? extends INovelItem>  moveChildDown(S child, int newPosition) {
        List<? extends INovelItem> allConcernedChildren  = child.getParent().getChildren().stream()
                .filter(otherChild -> otherChild.getPosition() > child.getPosition() && otherChild.getPosition() <= newPosition)
                .collect(Collectors.toList());
        allConcernedChildren.forEach(otherChild -> otherChild.setPosition(otherChild.getPosition() - 1));
        return allConcernedChildren;
    }

    private int getMaxPosition(Long novelId) {
        GroupingNovelItem maxPosition = this.getParentRepository().findTopByNovelIdOrderByPositionDesc(novelId);
        if (maxPosition == null) {
            return 0;
        }
        return maxPosition.getPosition() + 1;
    }
}
