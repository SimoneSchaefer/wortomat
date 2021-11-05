/// <reference types="cypress" />

import { NovelList } from "../../page-objects/NovelList";


describe('novels', () => {
  const TITLE = "my first novel <3";
  const TITLE_2 = "my new bestseller";
  const SUMMARY = "something happening here";
  const SUMMARY_2 = "something going on";
  const novelList = new NovelList();

  beforeEach(() => {
    cy.visit('')
  })

  it('displays dummy novel card by default', () => {
    cy.get('.novels').should('be.visible');
    cy.get('.dummy-novel').should('be.visible');
    novelList.novelCards.should('have.length', 1);
  });

  it('can add new novel', () => {
    novelList.addNovel();
    novelList.hasDummySummary(1);
    novelList.hasDummyTitle(1);
  });  

  it('can set novel name', () => {
    novelList.novelCards.should('have.length', 2);
    novelList.updateName(1, TITLE);
  });

  it('can set summary', () => {
    novelList.novelCards.should('have.length', 2);
    novelList.hasTitle(1, TITLE)
    novelList.updateSummary(1, SUMMARY);
  });

  it('can cancel update name', () => {
    novelList.novelCards.should('have.length', 2);
    novelList.hasTitle(1, TITLE)
    novelList.hasSummary(1, SUMMARY);
    novelList.updateName(1, TITLE_2, false);
    novelList.hasTitle(1, TITLE)
    novelList.hasSummary(1, SUMMARY);
  });

  it('can cancel update summary', () => {
    novelList.novelCards.should('have.length', 2);
    novelList.hasTitle(1, TITLE)
    novelList.hasSummary(1, SUMMARY);
    novelList.updateSummary(1, SUMMARY_2, false);
    novelList.hasTitle(1, TITLE)
    novelList.hasSummary(1, SUMMARY);
  });

  it('can update name', () => {
    novelList.novelCards.should('have.length', 2);
    novelList.hasTitle(1, TITLE)
    novelList.hasSummary(1, SUMMARY);
    novelList.updateName(1, TITLE_2);
  });

  it('can update summary', () => {
    novelList.novelCards.should('have.length', 2);
    novelList.hasTitle(1, TITLE_2)
    novelList.hasSummary(1, SUMMARY);
    novelList.updateSummary(1, SUMMARY_2);
  });

  it('can delete name', () => {
    novelList.novelCards.should('have.length', 2);
    novelList.hasTitle(1, TITLE_2)
    novelList.hasSummary(1, SUMMARY_2);
    novelList.updateName(1, '');
  });

  it('can delete summary', () => {
    novelList.novelCards.should('have.length', 2);
    novelList.hasDummyTitle(1);
    novelList.hasSummary(1, SUMMARY_2);
    novelList.updateSummary(1, '');
  });

  it('can open novel', () => {
    novelList.novelCards.should('have.length', 2);
    novelList.hasDummyTitle(1);
    novelList.hasDummySummary(1);
    novelList.openNovel(1);
  });

  it('can cancel delete novel', () => {
    novelList.novelCards.should('have.length', 2);
    novelList.hasDummyTitle(1);
    novelList.hasDummySummary(1);
    novelList.deleteNovel(1, false);
    novelList.novelCards.should('have.length', 2);
  });

  it('can confirm delete novel', () => {
    novelList.novelCards.should('have.length', 2);
    novelList.hasDummyTitle(1);
    novelList.hasDummySummary(1);
    novelList.deleteNovel(1, true);
    novelList.novelCards.should('have.length', 1);
  });
});
