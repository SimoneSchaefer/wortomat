package de.wortomat.service;


import de.wortomat.exceptions.NotFoundException;
import de.wortomat.model.Novel;
import de.wortomat.repository.NovelRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;


@Service
public class NovelService {
    @Autowired
    NovelRepository novelRepository;

    public List<Novel> list() {
        return this.novelRepository.findByOrderByPositionAsc();
    }

    public Novel get(Long novelId) {
        return this.novelRepository.findById(novelId).orElseThrow(NotFoundException::new);
    }

    @Transactional
    public Novel create(Novel novel) {
        return this.novelRepository.save(novel);
    }

    @Transactional
    public Novel update(Novel novel) {
        return this.novelRepository.save(novel);
    }

    @Transactional
    public void delete(Long novelId) {
        this.novelRepository.deleteById(novelId);
    }
}
