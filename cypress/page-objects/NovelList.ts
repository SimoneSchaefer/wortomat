import { Chapters } from "./Chapters";
import { Confirm } from "./components/Confirm";
import { InlineEdit } from "./components/InlineEdit";
import { GroupingItemPage } from "./GroupingItemPage";

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
        this.title(index).find('.dummy').should('contain.text', 'Unnamed novel')
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

    updateName(index: number, oldValue: string, newName: string, confirm = true) {
        this.inlineEdit.updateInput(this.titleSelector(index), oldValue, newName, confirm);
        if (confirm) {
            if (newName.length) this.hasTitle(index, newName);
            else this.hasDummyTitle(index);
        } else {
            if (oldValue.length) this.hasTitle(index, oldValue);
        }

    }

    updateSummary(index: number, oldValue: string, newName: string, confirm = true) {
        this.inlineEdit.updateInput(this.contentSelector(index), oldValue, newName, confirm);
        if (confirm) {
            if (newName.length) this.hasSummary(index, newName);
            else this.hasDummySummary(1);
        } else {
            if (oldValue.length) this.hasSummary(index, oldValue);
        }
    }

    openNovel(index: number) {
        this.novelCards.eq(index).find('.option-buttons .p-button').eq(0).click();
    }

    deleteNovel(index: number, confirm: boolean) {
        this.novelCards.then($items => {
            this.novelCards.eq(index).find('.option-buttons .p-button').eq(1).click();
            confirm ? this.confirm.confirm() : this.confirm.cancel();

            const expectedLength = confirm ? $items.length - 1 : $items.length;
            this.novelCards.should('have.length', expectedLength);
        });      
    }

    title(index: number): Cypress.Chainable {
        return cy.get(this.titleSelector(index));
    }

    content(index: number): Cypress.Chainable {
        return cy.get(this.contentSelector(index));
    }

    titleSelector(index: number): string {
        return `.novel-card:eq(${index}) .p-card-title`; 
    }

    contentSelector(index: number): string {
        return `.novel-card:eq(${index}) .p-card-content`; 
    }

    get novelCards(): Cypress.Chainable {
        return cy.get('#app').find('.novel-card');
    }
}