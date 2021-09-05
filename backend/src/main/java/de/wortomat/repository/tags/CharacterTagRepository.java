package de.wortomat.repository.tags;


import de.wortomat.model.CharacterTag;
import de.wortomat.model.LocationTag;
import org.springframework.data.repository.CrudRepository;
import org.springframework.stereotype.Repository;

@Repository
public interface CharacterTagRepository extends TagRepository<CharacterTag, Long> {};