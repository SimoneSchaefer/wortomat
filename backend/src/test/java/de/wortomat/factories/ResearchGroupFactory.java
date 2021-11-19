package de.wortomat.factories;


import de.wortomat.model.ResearchGroup;

import java.util.Random;

public class ResearchGroupFactory {
    public static ResearchGroup createMockGroup() {
        ResearchGroup part = new ResearchGroup();
        part.setId(new Random().nextLong());
        part.setPosition(new Random().nextInt());
        part.setName(FactoryUtils.createRandomString());
        return part;
    }
}
