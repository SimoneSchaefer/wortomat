package de.wortomat.repository;

import de.wortomat.model.NovelItem;
import de.wortomat.model.NovelItemTag;
import org.springframework.data.repository.CrudRepository;
import org.springframework.data.repository.NoRepositoryBean;

import java.util.List;

@NoRepositoryBean
public interface NovelItemTagRepository<S extends NovelItemTag> extends CrudRepository<NovelItemTag, Long> {
    List<S> findByNovelIdOrderByName(Long novelId);
}
