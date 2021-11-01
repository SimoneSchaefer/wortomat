package de.wortomat.repository;

import de.wortomat.model.NovelItem;
import org.springframework.data.repository.CrudRepository;
import org.springframework.data.repository.NoRepositoryBean;

import java.util.List;

@NoRepositoryBean
public interface NovelItemRepository<T extends NovelItem, Long> extends CrudRepository<T, Long> {}
