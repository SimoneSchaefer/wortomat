package de.wortomat.repository;


import de.wortomat.model.ChapterTag;
import de.wortomat.model.PlotlineEventTag;
import org.springframework.stereotype.Repository;

@Repository
public interface PlotlineTagRepository extends NovelItemTagRepository<PlotlineEventTag> {};