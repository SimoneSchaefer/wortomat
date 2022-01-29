package de.wortomat.repository;


import de.wortomat.model.CharacterTag;
import de.wortomat.model.LocationTag;
import org.springframework.stereotype.Repository;

@Repository
public interface LocationTagRepository extends NovelItemTagRepository<LocationTag> {};