/// <reference types="cypress" />

import { Chapters } from "../../page-objects/Chapters";
import { NovelList } from "../../page-objects/NovelList";


describe('parts', () => {
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
        new Chapters().displaysInfoBox('You haven\'t created any parts yet.');

        chapters.addItem();
        chapters.assertHeaders(['']);

        chapters.addItem();
        chapters.assertHeaders(['', '']);  

        chapters.displaysInfoBox('Create a new chapter');
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

    it('can add new part', () => {
        chapters.assertHeaders([TITLE]);  
        chapters.addItem();
        chapters.assertHeaders([ TITLE, '']);  
    });
});
