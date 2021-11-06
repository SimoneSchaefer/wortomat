/// <reference types="cypress" />

import { Chapters } from "../../page-objects/Chapters";
import { NovelList } from "../../page-objects/NovelList";


describe('parts', () => {
    const novelList = new NovelList();
    const chapters = new Chapters();

    const TITLE = 'part 1';
    const CHAPTER_TITLE = 'chapter 1';

    before(() => {
        cy.visit('');
        novelList.novelCards.should('have.length', 2);
    });

    beforeEach(() => {
        cy.visit('');
        novelList.novelCards.should('have.length', 2);
        novelList.openNovel(1);
    });      
    
    it('can add children', () => {
        chapters.assertHeaders([TITLE, '']);  

        chapters.addChild(0);
        chapters.assertChildren(0, ['']);
        chapters.assertChildren(1, []);
        chapters.childSelected(0, 0);

        chapters.addChild(0);
        chapters.assertChildren(0, ['', '']);
        chapters.assertChildren(1, []);
        chapters.childSelected(0, 1);
    });


    it('can cancel rename child', () => {
        chapters.assertChildren(0, ['', '']);
        chapters.renameSelectedChild('', CHAPTER_TITLE, false);   
    });

    it('can rename child', () => {
        chapters.assertChildren(0, ['', '']);
        chapters.renameSelectedChild('', CHAPTER_TITLE, true);   
    });

    it('selects first item when loaded', () => {
        chapters.assertHeaders([TITLE, '']);  
        chapters.childSelected(0, 0);
        chapters.sheethasTitle(CHAPTER_TITLE);
    });

    it('can cancel remove child', () => {
        chapters.assertHeaders([TITLE, '']);  
        chapters.assertChildren(0, [CHAPTER_TITLE, '']);
        chapters.removeChild(0, 0, false);
        chapters.assertChildren(0, [CHAPTER_TITLE, '']);
    });

    it('can remove child', () => {
        chapters.assertHeaders([TITLE, '']);  
        chapters.assertChildren(0, [CHAPTER_TITLE, '']);
        chapters.removeChild(0, 0, true);
        chapters.assertChildren(0, ['']);
    });

});
