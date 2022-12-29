package de.wortomat.model;

import lombok.Getter;
import lombok.RequiredArgsConstructor;
import lombok.Setter;
import lombok.ToString;

import javax.persistence.Entity;

@Entity
@ToString
@Getter
@Setter
@RequiredArgsConstructor
public class PlotlineEvent extends NovelItem<Plotline> {
}
