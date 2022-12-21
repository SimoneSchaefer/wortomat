package de.wortomat.model;

import lombok.*;

import javax.persistence.Entity;
import javax.persistence.OneToMany;
import java.util.Collections;
import java.util.List;

@Entity
@Data
public class Plotline extends GroupingNovelItem<PlotlineEvent>  {

    @OneToMany(mappedBy = "parent")
    private List<PlotlineEvent> children = Collections.emptyList();

}
