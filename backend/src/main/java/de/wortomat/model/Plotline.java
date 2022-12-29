package de.wortomat.model;

import com.fasterxml.jackson.annotation.JsonIgnore;
import lombok.Data;

import javax.persistence.Entity;
import javax.persistence.OneToMany;
import java.util.Collections;
import java.util.List;

@Entity
@Data
public class Plotline extends GroupingNovelItem<PlotlineEvent> {

    String color;

    @OneToMany(mappedBy = "parent")
    private List<PlotlineEvent> children = Collections.emptyList();


    @OneToMany(mappedBy = "plotline")
    @JsonIgnore
    private List<Chapter> chapters = Collections.emptyList();
}
