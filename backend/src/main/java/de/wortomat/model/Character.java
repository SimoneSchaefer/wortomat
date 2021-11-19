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
public class Character extends NovelItem implements ImageAware {
    @ManyToMany
    @ToString.Exclude
    private List<CharacterTag> tags;

    @JsonIgnore
    @ManyToOne
    @JsonIdentityReference(alwaysAsId = true)
    private CharacterGroup characterGroup;

    @Override
    @JsonIgnore
    public IGroupingNovelItem getParent() {
        return this.getCharacterGroup();
    }

    @Override
    public void setParent(IGroupingNovelItem parent) {
        this.characterGroup = (CharacterGroup) parent;
    }

    @Override
    public Long getParentId() {
        return getParent().getId();
    }

}
