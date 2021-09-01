package de.wortomat.service;

import de.wortomat.model.Chapter;
import de.wortomat.repository.ChapterRepository;
import de.wortomat.repository.PositionAwareRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import org.springframework.util.ObjectUtils;

import java.util.ArrayList;
import java.util.List;

@Service
public class ChapterService extends PositionAwareService<Chapter>{
    @Autowired
    ChapterRepository chapterRepository;

    @Override
    public PositionAwareRepository<Chapter, Long> getRepository() {
        return this.chapterRepository;
    }
}