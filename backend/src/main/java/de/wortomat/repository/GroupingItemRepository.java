package de.wortomat.repository;

import de.wortomat.model.IGroupingNovelItem;
import org.springframework.data.repository.CrudRepository;
import org.springframework.data.repository.NoRepositoryBean;

import java.util.List;

@NoRepositoryBean
public interface GroupingItemRepository<T extends IGroupingNovelItem, Long> extends CrudRepository<T, Long> {
    T findTopByNovelIdOrderByPositionDesc(Long novelId);
    List<T> findAllByNovelIdOrderByPosition(Long novelId);
}
