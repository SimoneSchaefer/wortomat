/// <reference types="cypress" />

import { GroupingItemPage } from "../../page-objects/GroupingItemPage";
import { NovelList } from "../../page-objects/NovelList";
import { novelItemsSpecDefinition } from "./spec-definitions";

xdescribe('Novel items', () => {
    const novelList = new NovelList();
    const groupingItemPage = new GroupingItemPage();
    const TITLE = 'group name 1';
    const CHILD_TITLE = 'child name 1';
    const CHILD_SUMMARY = 'something is happening here';
    const EXTENDED_CHILD_SUMMARY = 'some additional details go here.';

    before(() => {
        cy.visit('');
        novelList.novelCards.should('have.length', 1);
        novelList.addNovel();
    });

    for (const spec of novelItemsSpecDefinition) { 
        describe(spec.specName, () => {
            beforeEach(() => {
                cy.visit('');
                novelList.novelCards.should('have.length', 2);
                novelList.openNovel(1);
                cy.get('.navigation-link').eq(spec.index).click();
                cy.get('.navigation-link').eq(spec.index).should('have.class', 'active');
            });

            it('can add groups', () => {
                groupingItemPage.assertHeaders([]);
                groupingItemPage.displaysInfoBox(spec.emptyParentInfo);

                groupingItemPage.addItem();
                groupingItemPage.assertHeaders([spec.unnamedParentText]);

                groupingItemPage.addItem();
                groupingItemPage.assertHeaders([spec.unnamedParentText, spec.unnamedParentText]);  

                groupingItemPage.displaysInfoBox(spec.emptyChildInfo);
            });

            it('can cancel update groups name', () => {
                groupingItemPage.assertHeaders([spec.unnamedParentText, spec.unnamedParentText]);  
                groupingItemPage.renameItem(1, spec.unnamedParentText, TITLE, false);    
            });

            it('can rename groups', () => {
                groupingItemPage.assertHeaders([spec.unnamedParentText, spec.unnamedParentText]);  
                groupingItemPage.renameItem(1, spec.unnamedParentText, TITLE, true);
            });

            it('can delete groups name', () => {
                groupingItemPage.assertHeaders([spec.unnamedParentText, TITLE]);  
                groupingItemPage.renameItem(1, TITLE, spec.unnamedParentText, true);
            });

            it('can delete groups', () => {
                groupingItemPage.assertHeaders([spec.unnamedParentText, spec.unnamedParentText]);  
                groupingItemPage.renameItem(1, spec.unnamedParentText, TITLE, true);    
                groupingItemPage.assertHeaders([spec.unnamedParentText, TITLE]);  

                groupingItemPage.deleteItem(0);
                groupingItemPage.assertHeaders([TITLE]);  
            });

            it('can re-add new groups', () => {
                groupingItemPage.assertHeaders([TITLE]);  
                groupingItemPage.addItem();
                groupingItemPage.assertHeaders([ TITLE, spec.unnamedParentText]);  
            });  
            
            it('can add children', () => {
                groupingItemPage.assertHeaders([TITLE, spec.unnamedParentText]);  
        
                groupingItemPage.addChild(0);
                groupingItemPage.assertChildren(0, [spec.unnamedChildText]);
                groupingItemPage.assertChildren(1, []);
                groupingItemPage.childSelected(0, 0);
        
                groupingItemPage.addChild(0);
                groupingItemPage.assertChildren(0, [spec.unnamedChildText, spec.unnamedChildText]);
                groupingItemPage.assertChildren(1, []);
                groupingItemPage.childSelected(0, 1);
            });        
        
            it('can cancel rename child', () => {
                groupingItemPage.assertChildren(0, [spec.unnamedChildText, spec.unnamedChildText]);
                groupingItemPage.renameSelectedChild(spec.unnamedChildText, CHILD_TITLE, false);   
            });
        
            it('can rename child', () => {
                groupingItemPage.assertChildren(0, [spec.unnamedChildText, spec.unnamedChildText]);
                groupingItemPage.renameSelectedChild(spec.unnamedChildText, CHILD_TITLE, true);   
            });
        
            it('selects first item when loaded', () => {
                groupingItemPage.assertHeaders([TITLE, spec.unnamedParentText]);  
                groupingItemPage.childSelected(0, 0);
                groupingItemPage.sheethasTitle(CHILD_TITLE);
                groupingItemPage.sheethasSummary(spec.missingSummaryChildText);
                groupingItemPage.sheethasExtendedSummary(spec.missingExtendedSummaryChildText);
            });
        
            it('can cancel remove child', () => {
                groupingItemPage.assertHeaders([TITLE, spec.unnamedParentText]);  
                groupingItemPage.assertChildren(0, [CHILD_TITLE, spec.unnamedChildText]);
                groupingItemPage.removeChild(0, 0, false);
                groupingItemPage.assertChildren(0, [CHILD_TITLE, spec.unnamedChildText]);
            });
        
            it('can remove child', () => {
                groupingItemPage.assertHeaders([TITLE, spec.unnamedParentText]);  
                groupingItemPage.assertChildren(0, [CHILD_TITLE, spec.unnamedChildText]);
                groupingItemPage.removeChild(0, 0, true);
                groupingItemPage.assertChildren(0, [spec.unnamedChildText]);
            });
        });
    } 
});

