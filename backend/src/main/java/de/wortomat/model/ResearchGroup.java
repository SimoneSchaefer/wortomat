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

    private int position;

    @JsonIgnore
    @ManyToOne
    private Novel novel;

    @OneToMany(mappedBy = "researchGroup")
    private List<Research> research = new ArrayList<>();

    @Override()
    public Long getId() { return this.id; }

    @Override()
    public int getPosition() { return this.position; }

    @Override
    @JsonIgnore
    public List getChildren() {
        return this.getResearch();
    }

    @Override
    public void setNovel(Novel novel) {
        this.novel = novel;
    }
    
    @Override()
    public void setPosition(int position) { this.position = position; }

}
