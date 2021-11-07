package de.wortomat.model;

import com.fasterxml.jackson.annotation.JsonIdentityReference;
import com.fasterxml.jackson.annotation.JsonIgnore;
import lombok.Data;

import javax.persistence.*;
import java.util.List;

@Entity
@Data
public class Character implements NovelItem, ImageAware {
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
    private List<CharacterTag> tags;

    @JsonIgnore
    @ManyToOne
    @JsonIdentityReference(alwaysAsId = true)
    private CharacterGroup characterGroup;

    @Override()
    public Long getId() { return this.id; }

    @Override()
    public int getPosition() { return this.position; }

    @Override
    @JsonIgnore
    public GroupingNovelItem getParent() {
        return this.getCharacterGroup();
    }

    @Override
    public void setParent(GroupingNovelItem parent) {
        this.characterGroup = (CharacterGroup) parent;
    }

    @Override()
    public void setPosition(int position) { this.position = position; }

}
