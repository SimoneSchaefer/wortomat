package de.wortomat.factories;

import de.wortomat.model.Novel;

import java.util.Random;

public class NovelFactory {
    public static Novel createMockNovel() {
        Novel novel = new Novel();
        novel.setId(new Random().nextLong());
        novel.setPosition(new Random().nextInt());
        novel.setAuthor(FactoryUtils.createRandomString());
        novel.setName(FactoryUtils.createRandomString());
        novel.setSummary(FactoryUtils.createRandomString());
        return novel;
    }
}
