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
public class Location extends NovelItem<LocationGroup> implements ImageAware {

    @ManyToMany
    @ToString.Exclude
    private List<LocationTag> tags;
}
