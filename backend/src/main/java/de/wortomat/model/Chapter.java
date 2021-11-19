package de.wortomat.model;

import com.fasterxml.jackson.annotation.JsonIdentityReference;
import com.fasterxml.jackson.annotation.JsonIgnore;
import lombok.*;

import javax.persistence.*;
import java.util.List;

@Entity
@ToString
@Getter
@Setter
@RequiredArgsConstructor
public class Chapter extends NovelItem {
    @ManyToMany
    @ToString.Exclude
    private List<ChapterTag> tags;

    @JsonIgnore
    @ManyToOne
    @JsonIdentityReference(alwaysAsId = true)
    private Part part;

    @Override
    public Long getParentId() {
        return getParent().getId();
    }

    @Override
    @JsonIgnore
    public GroupingNovelItem getParent() {
        return this.getPart();
    }

    @Override
    public void setParent(GroupingNovelItem parent) {
        this.part = (Part) parent;
    }
}
