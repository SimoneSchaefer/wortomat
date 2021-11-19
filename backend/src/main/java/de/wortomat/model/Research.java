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
    @ToString.Exclude
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
    public IGroupingNovelItem getParent() {
        return this.getResearchGroup();
    }

    @Override
    public void setParent(IGroupingNovelItem parent) {
        this.researchGroup = (ResearchGroup) parent;
    }
}
