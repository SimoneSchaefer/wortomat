package de.wortomat.model;

import lombok.Getter;
import lombok.RequiredArgsConstructor;
import lombok.Setter;
import lombok.ToString;

import javax.persistence.Entity;
import javax.persistence.ManyToMany;
import java.util.List;

@Entity
@ToString
@Getter
@Setter
@RequiredArgsConstructor
public class Character extends NovelItem<CharacterGroup> implements ImageAware {
    @ManyToMany
    @ToString.Exclude
    private List<CharacterTag> tags;
}
