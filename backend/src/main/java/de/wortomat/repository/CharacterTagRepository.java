package de.wortomat.repository;


import de.wortomat.model.ChapterTag;
import de.wortomat.model.CharacterTag;
import org.springframework.stereotype.Repository;

@Repository
public interface CharacterTagRepository extends NovelItemTagRepository<CharacterTag> {};