package de.wortomat.repository.tags;


import de.wortomat.model.ChapterTag;
import de.wortomat.model.ResearchTag;
import org.springframework.data.repository.CrudRepository;
import org.springframework.stereotype.Repository;

@Repository
public interface ResearchTagRepository extends TagRepository<ResearchTag, Long> {};