package de.wortomat.model;

import com.fasterxml.jackson.annotation.JsonIgnore;
import lombok.Data;

import javax.persistence.*;
import java.util.ArrayList;
import java.util.List;

@Entity
@Data
public class ResearchGroup extends GroupingNovelItem {
    @OneToMany(mappedBy = "researchGroup")
    private List<Research> research = new ArrayList<>();

    @Override
    @JsonIgnore
    public List getChildren() {
        return this.getResearch();
    }

}
