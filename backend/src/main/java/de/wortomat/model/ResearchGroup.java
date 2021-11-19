package de.wortomat.model;

import com.fasterxml.jackson.annotation.JsonIgnore;
import lombok.Data;

import javax.persistence.*;
import java.util.ArrayList;
import java.util.List;

@Entity
@Data
public class ResearchGroup implements GroupingNovelItem {
    @Id
    @GeneratedValue(strategy = GenerationType.AUTO)
    private Long id;

    private String name;

    private Integer position;

    @JsonIgnore
    @ManyToOne
    private Novel novel;

    @OneToMany(mappedBy = "researchGroup")
    private List<Research> research = new ArrayList<>();


    @Override
    @JsonIgnore
    public List getChildren() {
        return this.getResearch();
    }

    @Override
    public void setNovel(Novel novel) {
        this.novel = novel;
    }
}
