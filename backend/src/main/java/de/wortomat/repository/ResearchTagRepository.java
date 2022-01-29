package de.wortomat.repository;


import de.wortomat.model.LocationTag;
import de.wortomat.model.ResearchTag;
import org.springframework.stereotype.Repository;

@Repository
public interface ResearchTagRepository extends NovelItemTagRepository<ResearchTag> {};