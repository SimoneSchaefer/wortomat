export class NovelList {
    addNovel() {
        this.novelCards.then($items => {
            cy.get('[data-cy=add-novel]').click();
            this.novelCards.should('have.length', ($items.length || 0) + 1);
        });
    }

    get novelCards(): Cypress.Chainable {
        return cy.get('#app').find('.novel-card');
    }
}