package de.wortomat.repository;

import de.wortomat.model.INovelItem;
import org.springframework.data.repository.CrudRepository;
import org.springframework.data.repository.NoRepositoryBean;

@NoRepositoryBean
public interface NovelItemRepository<T extends INovelItem, Long> extends CrudRepository<T, Long> {}
