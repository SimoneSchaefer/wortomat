package de.wortomat.repository;


import de.wortomat.model.Chapter;
import org.springframework.stereotype.Repository;

@Repository
public interface PlotlineEventRepository extends NovelItemRepository<Chapter> {};