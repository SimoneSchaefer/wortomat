package de.wortomat.model;

import com.fasterxml.jackson.annotation.JsonIgnore;
import lombok.Data;

import javax.persistence.*;
import java.util.Collections;
import java.util.List;

@Entity
@Data
public class LocationGroup extends GroupingNovelItem {
    @OneToMany(mappedBy = "parent")
    private List<Location> locations = Collections.emptyList();

    @Override
    @JsonIgnore
    public List getChildren() {
        return this.getLocations();
    }
}
