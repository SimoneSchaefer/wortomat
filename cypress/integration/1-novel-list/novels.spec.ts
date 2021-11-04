/// <reference types="cypress" />

import { NovelList } from "../../page-objects/NovelList";

describe('novels', () => {
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
  });  

  it('can update novel name', () => {

  });
});
