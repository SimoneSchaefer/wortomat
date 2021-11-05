export class InlineEdit {
    updateInput(parent: Cypress.Chainable, newValue: string) {
        parent.find('.inline-edit')
            .click()
            .find('.editable').clear().type(newValue)
            .parentsUntil('.inline-edit')
            .find('.options .p-button-success').click();
    }
}