package de.wortomat.repository;


import de.wortomat.model.Chapter;
import org.springframework.stereotype.Repository;

@Repository
public interface ChapterRepository extends NovelItemRepository<Chapter> {};