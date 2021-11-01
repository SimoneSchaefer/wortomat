package de.wortomat.repository;

import de.wortomat.model.GroupingNovelItem;
import org.springframework.data.repository.CrudRepository;
import org.springframework.data.repository.NoRepositoryBean;

import java.util.List;

@NoRepositoryBean
public interface GroupingItemRepository<T extends GroupingNovelItem, Long> extends CrudRepository<T, Long> {
    T findTopByNovelIdOrderByPositionDesc(Long novelId);
    List<T> findAllByNovelIdOrderByPosition(Long novelId);
}
