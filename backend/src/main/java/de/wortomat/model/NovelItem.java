package de.wortomat.model;

import com.fasterxml.jackson.annotation.JsonIdentityReference;
import com.fasterxml.jackson.annotation.JsonIgnore;
import lombok.Getter;
import lombok.Setter;

import javax.persistence.*;
import java.util.Date;
import java.util.List;

@MappedSuperclass
@Getter
@Setter
public abstract class NovelItem<T extends GroupingNovelItem> implements INovelItem<T> {
    @Id
    @GeneratedValue(strategy = GenerationType.AUTO)
    private Long id;

    private String name;

    private String summary;

    private String extended_summary;

    private Integer position;

    private Date deletedAt;

    @JsonIgnore
    @ManyToOne
    @JsonIdentityReference(alwaysAsId = true)
    private T parent;

    @Column(columnDefinition = "TEXT")
    private String content;

    @ManyToMany
    private List<Image> images;

    @Override
    public Long getParentId() {
        return getParent() == null ? null : getParent().getId();
    }
}
