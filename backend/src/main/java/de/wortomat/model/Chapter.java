package de.wortomat.model;

import com.fasterxml.jackson.annotation.JsonIdentityReference;
import lombok.Getter;
import lombok.RequiredArgsConstructor;
import lombok.Setter;
import lombok.ToString;

import javax.persistence.Entity;
import javax.persistence.ManyToMany;
import javax.persistence.ManyToOne;
import java.util.List;

@Entity
@ToString
@Getter
@Setter
@RequiredArgsConstructor
public class Chapter extends NovelItem<Part> {
    @ManyToMany
    @ToString.Exclude
    private List<ChapterTag> tags;

    @ManyToOne
    @JsonIdentityReference(alwaysAsId = true)
    private Plotline plotline;
}
