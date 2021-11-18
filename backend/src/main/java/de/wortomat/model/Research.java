package de.wortomat.model;

import com.fasterxml.jackson.annotation.JsonIdentityReference;
import com.fasterxml.jackson.annotation.JsonIgnore;
import lombok.Data;

import javax.persistence.*;
import java.util.List;

@Entity
@Data
public class Research implements NovelItem, ImageAware {
    @Id
    @GeneratedValue(strategy = GenerationType.AUTO)
    private Long id;

    private String name;

    private String summary;

    private String extended_summary;

    private int position;

    @Column(columnDefinition = "TEXT")
    private String content;

    @ManyToMany
    private List<Image> images;

    @ManyToMany
    private List<ResearchTag> tags;

    @JsonIgnore
    @ManyToOne
    @JsonIdentityReference(alwaysAsId = true)
    private ResearchGroup researchGroup;

    @Override()
    public Long getId() { return this.id; }

    @Override()
    public int getPosition() { return this.position; }

    @Override
    public Long getParentId() {
        return getParent().getId();
    }

    @Override
    @JsonIgnore
    public GroupingNovelItem getParent() {
        return this.getResearchGroup();
    }

    @Override
    public void setParent(GroupingNovelItem parent) {
        this.researchGroup = (ResearchGroup) parent;
    }

    @Override()
    public void setPosition(int position) { this.position = position; }

    @Override
    public List<Image> getImages() { return this.images; }
}
