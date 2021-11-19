package de.wortomat.model;

import lombok.Data;

import javax.persistence.Entity;
import javax.persistence.OneToMany;
import java.util.Collections;
import java.util.List;

@Entity
@Data
public class Part extends GroupingNovelItem<Chapter> {
    @OneToMany(mappedBy = "parent")
    private List<Chapter> children = Collections.emptyList();
}
