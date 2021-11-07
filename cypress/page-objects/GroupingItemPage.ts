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

    renameSelectedChild(oldName: string, newName: string, confirm = true) {
        this.inlineEdit.updateInput('.sheet .header-container .meta .header', oldName, newName, confirm);
    }

    displaysInfoBox(expectedText: string) {
        cy.get('.help-note').find('iframe').its('0.contentDocument.body').should('contain.text', expectedText);
    }

    removeChild(parentIndex: number, childIndex: number, confirm = true) {
        this.children(parentIndex).eq(childIndex).find('.p-button-danger').click();
        if (confirm) this.confirm.confirm();
        else this.confirm.cancel();
    }

    toggleAccordion(index: number) {
        cy.get('a.p-accordion-header-link > span').eq(index).click();
    }

    childSelected(parentIndex: number, childIndex: number) {
        this.children(parentIndex).its('length').then($numberOfChildren => {
            for (let i = 0; i < $numberOfChildren; i++) {
                const expected = childIndex === i ? 'have.class' : 'not.have.class';
                this.children(parentIndex).eq(i).should(expected, 'selected');
            }
        });
    }

    sheethasTitle(expectedTitle: string) {
        cy.get('.sheet .header-container .meta .header').should('have.text', expectedTitle);
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
        this.inlineEdit.updateInput(this.headerSelector(index), oldValue, newName, confirm);
        if (confirm) {
            if (newName.length) this.assertHeader(index, newName);
            else this.hasDummyHeader(1);
        } else {
            if (oldValue.length) this.assertHeader(index, oldValue);
        }
        
    }

    headerSelector(index: number): string {
        return `.p-accordion-header:eq(${index})`;
    }

    get headers() {
        return cy.get('.p-accordion-header');
    }
}