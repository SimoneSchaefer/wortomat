package de.wortomat.repository;


import de.wortomat.model.ChapterTag;
import org.springframework.stereotype.Repository;

@Repository
public interface ChapterTagRepository extends NovelItemTagRepository<ChapterTag> {};