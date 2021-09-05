package de.wortomat.repository.tags;

import org.springframework.data.repository.CrudRepository;
import org.springframework.data.repository.NoRepositoryBean;
import org.springframework.data.repository.query.Param;

import java.util.List;

@NoRepositoryBean
public interface TagRepository<T, Long> extends CrudRepository<T, Long> {
    List<T> findAllByNovelId(@Param("novelId") Long novelId);
}
