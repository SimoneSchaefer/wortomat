package de.wortomat.repository;

import org.springframework.data.repository.CrudRepository;
import org.springframework.data.repository.NoRepositoryBean;

@NoRepositoryBean
public interface NovelItemRepository<T> extends CrudRepository<T, Long> {
}
