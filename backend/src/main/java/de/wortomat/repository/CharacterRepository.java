package de.wortomat.repository;


import de.wortomat.model.Character;
import org.springframework.stereotype.Repository;

@Repository
public interface CharacterRepository extends NovelItemRepository<Character> {}
