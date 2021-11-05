import { Confirm } from "./components/Confirm";
import { InlineEdit } from "./components/InlineEdit";

export class GroupingItemPage {
    private inlineEdit = new InlineEdit();
    private confirm = new Confirm();

    assertHeaders (expectedTitles: string[]) {
        if (!expectedTitles.length) {
            this.headers.should('not.exist');
        } else {
            this.headers.should('have.length', expectedTitles.length);
            for (let i = 0; i < expectedTitles.length; i++) {
                this.assertHeader(i, expectedTitles[i]);
            }
        }
    }

    assertHeader (index: number, expectedTitle: string) {
        if (!expectedTitle.length) {
            this.hasDummyHeader(index);
        } else {
            this.headers.eq(index).should('contain.text', expectedTitle);
        }
    }

    hasDummyHeader(index: number) {
        this.headers.eq(index).should('contain.text', 'Unnamed part');
    }

    addItem() {
        cy.get('.w-sidebar-opener').click();
    }

    addChild(index: number) {
        cy.get('.group-options').eq(index).find('.p-button-primary').click( {force: true});
    }

    removeChild(parentIndex: number, childIndex: number, confirm = true) {
        this.children(parentIndex).eq(childIndex).find('.p-button-danger').click();
        if (confirm) this.confirm.confirm();
        else this.confirm.cancel();
    }

    toggleAccordion(index: number) {
        cy.get('a.p-accordion-header-link > span').eq(index).click();
    }
    

    assertChildren(index: number, expectedTitles: string[]) {
        this.children(index).should('have.length', expectedTitles.length);
        if (!expectedTitles.length) {
            this.children(index).should('not.exist');
        } else {
            this.children(index).should('have.length', expectedTitles.length);
            for (let i = 0; i < expectedTitles.length; i++) {
                this.assertChild(index, i, expectedTitles[i]);
            }
        }
    }

    assertChild(parentIndex: number, childIndex: number, expectedText: string) {
        if (expectedText.length) {
            this.children(parentIndex).eq(childIndex).should('contain.text', expectedText);
        } else {
            this.children(parentIndex).eq(childIndex).should('contain.text', 'Unnamed chapter');
        }
    }

    children(index: number): Cypress.Chainable {
        return cy.get('.p-accordion-content').eq(index).find('.tree-view-item');
    }

    deleteItem(index: number, confirm = true) {
        cy.get('.group-options').eq(index).find('.p-button-danger').click( {force: true});
        if (confirm) {
            this.confirm.confirm();
        } else {
            this.confirm.cancel();
        }
    }

    renameItem(index: number, oldValue: string, newName: string, confirm = true) {
        this.inlineEdit.updateInput(this.headers.eq(index), oldValue, newName, confirm);
        if (confirm) {
            if (newName.length) this.assertHeader(index, newName);
            else this.hasDummyHeader(1);
        } else {
            if (oldValue.length) this.assertHeader(index, oldValue);
        }
        
    }

    get headers() {
        return cy.get('.chapters-content .p-accordion-header');
    }
}