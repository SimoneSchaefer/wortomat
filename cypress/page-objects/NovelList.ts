import { Confirm } from "./components/Confirm";
import { InlineEdit } from "./components/InlineEdit";

export class NovelList {
    private inlineEdit = new InlineEdit();
    private confirm = new Confirm();

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

    updateName(index: number, newName: string, confirm = true) {
        this.inlineEdit.updateInput(this.title(index), newName, confirm);
        if (confirm) {
            if (newName.length) this.hasTitle(index, newName);
            else this.hasDummyTitle(index);
        }

    }

    updateSummary(index: number, newName: string, confirm = true) {
        this.inlineEdit.updateInput(this.content(index), newName, confirm);
        if (confirm) {
            if (newName.length) this.hasSummary(index, newName);
            else this.hasDummySummary(1);
        }
    }

    openNovel(index: number) {
        this.novelCards.eq(index).find('.option-buttons .p-button').eq(0).click();
        cy.get('.chapters-view').should('be.visible');
    }

    deleteNovel(index: number, confirm: boolean) {
        this.novelCards.then($items => {
            this.novelCards.eq(index).find('.option-buttons .p-button').eq(1).click();
            confirm ? this.confirm.confirm() : this.confirm.cancel();

            const expectedLength = confirm ? $items.length - 1 : $items.length;
            this.novelCards.should('have.length', expectedLength);
        });      
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