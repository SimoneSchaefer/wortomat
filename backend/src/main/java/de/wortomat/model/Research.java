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
public class Research extends NovelItem implements ImageAware {
    @ManyToMany
    private List<ResearchTag> tags;

    @JsonIgnore
    @ManyToOne
    @JsonIdentityReference(alwaysAsId = true)
    private ResearchGroup researchGroup;

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
}
