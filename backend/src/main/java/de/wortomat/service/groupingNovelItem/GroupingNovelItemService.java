package de.wortomat.service.groupingNovelItem;

import de.wortomat.exceptions.NotFoundException;
import de.wortomat.model.*;
import de.wortomat.repository.GroupingItemRepository;
import de.wortomat.repository.NovelItemRepository;
import de.wortomat.repository.NovelItemTagRepository;
import de.wortomat.service.NovelService;
import de.wortomat.service.novelItem.NovelItemService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.transaction.annotation.Transactional;

import java.util.ArrayList;
import java.util.Comparator;
import java.util.List;
import java.util.Objects;
import java.util.stream.Collectors;

public abstract class GroupingNovelItemService<T extends IGroupingNovelItem<S>, S extends INovelItem<T>, U extends INovelItemTag> {

    @Autowired
    protected NovelService novelService;

    protected abstract GroupingItemRepository<T, Long> getParentRepository();

    protected abstract NovelItemRepository<S> getChildRepository();

    protected abstract NovelItemService<T, S, U> getChildService();

    NovelItemTagRepository getTagRepository() { // TODO make abstract
        return null;
    }


    public List<T> get(Long novelId) {
        List<T> allParts = this.getParentRepository().findAllByNovelIdOrderByPosition(novelId).stream().filter(Objects::nonNull).collect(Collectors.toList());
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
        List<S> children = this.get(_novelId, parentId).getChildren();
        List<S> clone = new ArrayList<>(children);
        for (S child : clone) {
            this.getChildService().delete(_novelId, child.getId());
        }
        this.getParentRepository().deleteById(parentId);
    }

    public void deleteAll(Long novelId) {
        List<T> allItems = this.getParentRepository().findAllByNovelIdOrderByPosition(novelId);
        this.getParentRepository().deleteAll(allItems);
    }

    public List<S> getTags(Long novelId) {
        return getTagRepository().findByNovelIdOrderByName(novelId);
    }

    public Object createTag(Long novelId, U tag) {
        Novel novel = novelService.get(novelId);
        tag.setNovel(novel);
        NovelItemTagRepository repo = getTagRepository();
        NovelItemTag stored = (NovelItemTag) repo.save(tag);
        return stored;
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

    protected void moveChildToOtherParent(S child, int newPosition, Long newParentId) {
        T oldParent = this.getParentRepository().findById(child.getParent().getId()).orElseThrow(NotFoundException::new);
        T newParent = this.getParentRepository().findById(newParentId).orElseThrow(NotFoundException::new);

        sortChildren(oldParent);
        sortChildren(newParent);

        child.setParent(newParent);
        oldParent.getChildren().remove(child);
        newParent.getChildren().add(newPosition, child);
        updatePositions(oldParent.getChildren());
        updatePositions(newParent.getChildren());
        this.getParentRepository().save(oldParent);
        this.getParentRepository().save(newParent);
    }

    protected void moveChildWithinParent(S child, int newPosition) {
        sortChildren(child.getParent());
        List<S> children = child.getParent().getChildren();
        children.remove(child);
        children.add(newPosition, child);
        updatePositions(children);
    }

    void updatePositions(List<S> novelItems) {
        for (int i = 0; i < novelItems.size(); i++) {
            if (novelItems.get(i) != null) {
                novelItems.get(i).setPosition(i);
            }
        }

        this.getChildRepository().saveAll(novelItems.stream().filter(Objects::nonNull).collect(Collectors.toList()));
    }

    private int getMaxPosition(Long novelId) {
        T maxPosition = this.getParentRepository().findTopByNovelIdOrderByPositionDesc(novelId);
        if (maxPosition == null) {
            return 0;
        }
        return maxPosition.getPosition() + 1;
    }

    void sortChildren(T parent) {
        List<S> filteredChildren = parent.getChildren().stream().filter(child -> child != null && child.getDeletedAt() == null).collect(Collectors.toList());
        parent.setChildren(filteredChildren);
        parent.getChildren().sort(Comparator.comparing(INovelItem::getPosition));
    }
}
