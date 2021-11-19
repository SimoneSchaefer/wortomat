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
public class Location extends NovelItem implements ImageAware {

    @ManyToMany
    @ToString.Exclude
    private List<LocationTag> tags;

    @JsonIgnore
    @ManyToOne
    @JsonIdentityReference(alwaysAsId = true)
    private LocationGroup locationGroup;

    @Override
    @JsonIgnore
    public IGroupingNovelItem getParent() {
        return this.getLocationGroup();
    }

    @Override
    public void setParent(IGroupingNovelItem parent) {
        this.locationGroup = (LocationGroup) parent;
    }

    @Override
    public Long getParentId() {
        return getParent().getId();
    }
}
