/// <reference types="cypress" />

import { Chapters } from "../../page-objects/Chapters";
import { NovelList } from "../../page-objects/NovelList";


describe('novels', () => {
    const novelList = new NovelList();
    const chapters = new Chapters();

    const TITLE = 'part 1';

    before(() => {
        cy.visit('');
        novelList.novelCards.should('have.length', 1);
        novelList.addNovel();
    });

    beforeEach(() => {
        cy.visit('');
        novelList.novelCards.should('have.length', 2);
        novelList.openNovel(1);
    })

    it('can add parts', () => {
        chapters.assertHeaders([]);
        chapters.addItem();
        chapters.assertHeaders(['']);

        chapters.addItem();
        chapters.assertHeaders(['', '']);  
    });

    it('can cancel update part name', () => {
        chapters.assertHeaders(['', '']);  
        chapters.renameItem(1, '', TITLE, false);    
    });

    it('can rename part', () => {
        chapters.assertHeaders(['', '']);  
        chapters.renameItem(1, '', TITLE, true);
    });

    it('can delete part name', () => {
        chapters.assertHeaders(['', TITLE]);  
        chapters.renameItem(1, TITLE, '', true);
    });

    it('can delete part', () => {
        chapters.assertHeaders(['', '']);  
        chapters.renameItem(1, '', TITLE, true);    
        chapters.assertHeaders(['', TITLE]);  

        chapters.deleteItem(0);
        chapters.assertHeaders([TITLE]);  
    });    
    
    it('can add child', () => {
        chapters.assertHeaders([TITLE]);  

        chapters.addChild(0);
        chapters.addChild(0);
        chapters.assertChildren(0, ['', '']);
    });

    it('can cancel remove child', () => {
        chapters.toggleAccordion(0);
        chapters.assertChildren(0, ['', '']);
        chapters.removeChild(0, 0, false);
        chapters.assertChildren(0, ['', '']);
    });

    it('can remove child', () => {
        chapters.toggleAccordion(0);
        chapters.assertChildren(0, ['', '']);
        chapters.removeChild(0, 0, true);
        chapters.assertChildren(0, ['']);
    });

});
