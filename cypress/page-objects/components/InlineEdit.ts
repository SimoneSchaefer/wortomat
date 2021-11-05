export class InlineEdit {
    updateInput(parent: Cypress.Chainable, newValue: string, confirm = true) {
        parent = parent.find('.inline-edit')
            .click()
            .find('.editable').clear();
        if (newValue.length) {
            parent = parent.type(newValue);
        }
        const button = confirm ? '.p-button-success' : '.p-button-danger';
        parent.parentsUntil('.inline-edit')
            .find(`.options ${button}`).click();
    }
}