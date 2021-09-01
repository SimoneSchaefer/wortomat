package de.wortomat.repository;

import de.wortomat.model.PositionAware;
import org.springframework.data.repository.CrudRepository;
import org.springframework.data.repository.NoRepositoryBean;
import org.springframework.data.repository.query.Param;

import java.util.List;

@NoRepositoryBean
public interface PositionAwareRepository<T extends PositionAware, Long> extends CrudRepository<T, Long> {
    List<T> findAllByNovelIdOrderByPosition(@Param("novelId") Long novelId);
    T findTopByNovelIdOrderByPositionDesc(@Param("novelId") Long novelId);
}
