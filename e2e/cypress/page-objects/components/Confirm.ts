export class Confirm {
    confirm() {
        this.dialog.find('button').contains('Yes').click();
    }
    cancel() {
        this.dialog.find('button').contains('No').click();
    }

    get dialog() {
        return cy.get('.p-dialog');
    }
}