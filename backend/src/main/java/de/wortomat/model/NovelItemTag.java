package de.wortomat.model;

import com.fasterxml.jackson.annotation.JsonFormat;
import com.fasterxml.jackson.annotation.JsonIgnore;
import lombok.Getter;
import lombok.Setter;

import javax.persistence.*;

@MappedSuperclass
@Getter
@Setter
public class NovelItemTag<T extends INovelItem<?>> implements INovelItemTag {
    @Id
    @JsonFormat
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @JsonIgnore
    @ManyToOne
    private Novel novel;

    private String name;

    private Boolean containsTranslation;

    public void setNovel(Novel novel) {
        this.novel = novel;
    }
}
