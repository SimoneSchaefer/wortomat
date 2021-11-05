package de.wortomat.factories;

import de.wortomat.model.Part;

import java.util.Random;

public class PartFactory {
    public static Part createMockPart() {
        Part part = new Part();
        part.setId(new Random().nextLong());
        part.setPosition(new Random().nextInt());
        part.setName(FactoryUtils.createRandomString());
        return part;
    }
}
