package de.wortomat.model;

import com.fasterxml.jackson.annotation.JsonFormat;
import com.fasterxml.jackson.annotation.JsonIgnore;
import lombok.Getter;
import lombok.RequiredArgsConstructor;
import lombok.Setter;
import lombok.ToString;

import javax.persistence.*;
import java.util.Date;

@MappedSuperclass
@Getter
@Setter
@ToString
@RequiredArgsConstructor
public abstract class GroupingNovelItem<C extends INovelItem<?>> implements IGroupingNovelItem<C> {
    @Id
    @JsonFormat
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    private String name;

    private Integer position;

    private Boolean containsTranslation;

    @JsonIgnore
    @ManyToOne
    private Novel novel;
}
