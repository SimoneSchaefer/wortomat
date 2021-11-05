/// <reference types="cypress" />

import { NovelList } from "../../page-objects/NovelList";


describe('novels', () => {
  const TITLE = "my new bestseller <3";
  const SUMMARY = "something happening";
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

  it('can update novel name', () => {
    novelList.novelCards.should('have.length', 2);
    novelList.updateName(1, TITLE);
  });

  it('can update summary name', () => {
    novelList.novelCards.should('have.length', 2);
    novelList.hasTitle(1, TITLE)
    novelList.updateSummary(1, SUMMARY);
  });

  it('can open novel', () => {
    novelList.novelCards.should('have.length', 2);
    novelList.hasTitle(1, TITLE);
    novelList.hasSummary(1, SUMMARY);
    novelList.openNovel(1);
  });

  it('can delete novel', () => {


  });
});
