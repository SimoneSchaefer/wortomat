package de.wortomat.model;

import com.fasterxml.jackson.annotation.JsonIdentityReference;
import com.fasterxml.jackson.annotation.JsonIgnore;
import lombok.Getter;
import lombok.Setter;

import javax.persistence.*;
import java.util.List;

@MappedSuperclass
@Getter
@Setter
public abstract class NovelItem implements INovelItem {
    @Id
    @GeneratedValue(strategy = GenerationType.AUTO)
    private Long id;

    private String name;

    private String summary;

    private String extended_summary;

    private Integer position;

    @Column(columnDefinition = "TEXT")
    private String content;

    @ManyToMany
    private List<Image> images;

    @JsonIgnore
    @ManyToOne
    @JsonIdentityReference(alwaysAsId = true)
    private CharacterGroup characterGroup;

    @Override
    @JsonIgnore
    public GroupingNovelItem getParent() {
        return this.characterGroup;
    }

    @Override
    public void setParent(GroupingNovelItem parent) {
        this.characterGroup = (CharacterGroup) parent;
    }

    @Override
    public Long getParentId() {
        return getParent().getId();
    }
}
