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
    private List<CharacterTag> tags;

    @JsonIgnore
    @ManyToOne
    @JsonIdentityReference(alwaysAsId = true)
    private CharacterGroup characterGroup;

    @Override
    @JsonIgnore
    public GroupingNovelItem getParent() {
        return this.getCharacterGroup();
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
