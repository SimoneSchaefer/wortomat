package de.wortomat.model;

import lombok.Data;

import javax.persistence.Entity;
import javax.persistence.OneToMany;
import java.util.Collections;
import java.util.List;

@Entity
@Data
public class LocationGroup extends GroupingNovelItem {
    @OneToMany(mappedBy = "parent")
    private List<Location> children = Collections.emptyList();
}
