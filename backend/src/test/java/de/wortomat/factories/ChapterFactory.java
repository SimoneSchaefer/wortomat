package de.wortomat.factories;

import de.wortomat.model.Chapter;

import java.util.Random;

public class ChapterFactory {
    public static Chapter createMockChapter() {
        Chapter chapter = new Chapter();
        chapter.setId(new Random().nextLong());
        chapter.setPosition(new Random().nextInt());
        chapter.setName(FactoryUtils.createRandomString());
        return chapter;
    }
}
