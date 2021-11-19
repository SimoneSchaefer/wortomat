package de.wortomat.model;

import com.fasterxml.jackson.annotation.JsonIgnore;
import lombok.Data;

import javax.persistence.*;
import java.util.Collections;
import java.util.List;

@Entity
@Data
public class LocationGroup implements GroupingNovelItem {
    @Id
    @GeneratedValue(strategy = GenerationType.AUTO)
    private Long id;

    private String name;

    private Integer position;

    @JsonIgnore
    @ManyToOne
    private Novel novel;

    @OneToMany(mappedBy = "locationGroup")
    private List<Location> locations = Collections.emptyList();

    @Override
    @JsonIgnore
    public List getChildren() {
        return this.getLocations();
    }

    @Override
    public void setNovel(Novel novel) {
        this.novel = novel;
    }

}
