import { InlineEdit } from "./InlineEdit";

export class NovelList {
    private inlineEdit = new InlineEdit();

    addNovel() {
        this.novelCards.then($items => {
            cy.get('[data-cy=add-novel]').click();
            this.novelCards.should('have.length', ($items.length || 0) + 1);
        });
    }

    hasDummyTitle(index: number) {
        this.title(index).find('.dummy').should('contain.text', 'No title')
    }

    hasDummySummary(index: number) {
        this.content(index).find('.dummy').should('contain.text', 'No summary')
    }

    hasTitle(index: number, expectedTitle: string) {
        this.title(index).find('.dummy').should('not.exist');
        this.title(index).find('.readonly').should('contain.text', expectedTitle);
    }

    hasSummary(index: number, expectedSummary: string) {
        this.content(index).find('.dummy').should('not.exist');
        this.content(index).find('.readonly').should('contain.text', expectedSummary);
    }

    updateName(index: number, newName: string) {
        this.inlineEdit.updateInput(this.title(index), newName);
        this.hasTitle(index, newName);
    }

    updateSummary(index: number, newName: string) {
        this.inlineEdit.updateInput(this.content(index), newName);
        this.hasSummary(index, newName);
    }

    openNovel(index: number) {
        this.novelCards.eq(index).find('.option-buttons .p-button').eq(0).click();
        cy.get('.chapters-view').should('be.visible');
    }

    title(index: number) {
        return this.novelCards.eq(index).find('.p-card-title');
    }
    content(index: number) {
        return this.novelCards.eq(index).find('.p-card-content');
    }

    get novelCards(): Cypress.Chainable {
        return cy.get('#app').find('.novel-card');
    }
}