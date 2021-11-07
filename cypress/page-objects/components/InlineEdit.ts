export class InlineEdit {
    updateInput(parentSelector: string, oldValue: string, newValue: string, confirm = true) {
        cy.get(parentSelector).find('.inline-edit .readonly').click();
        cy.get(parentSelector).find('.inline-edit .editable').clear();
        if (newValue.length) {
            cy.get(parentSelector).find('.inline-edit').find('.editable').type(newValue);
        }
        const button = confirm ? '.p-button-success' : '.p-button-danger';
        cy.get(parentSelector).find(`.options ${button}`).click();

        const expectedText = confirm ? newValue : oldValue;
        cy.get(parentSelector).find('.readonly').should('contain.text', expectedText);
      
    }
}