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
    const CHILD_CONTENT = 'This will be a super awesome novel';

    before(() => {
        cy.visit('');
        novelList.novelCards.should('have.length', 2);
    });



    for (let spec of novelItemsSpecDefinition) {
        describe(spec.specName, () => {
            beforeEach(() => {
                cy.visit('');
                novelList.novelCards.should('have.length', 2);
                novelList.openNovel(1);
                cy.get('.navigation-link').eq(spec.index).click();
                cy.get('.navigation-link').eq(spec.index).should('have.class', 'active');
            });

            it('can cancel rename child', () => {
                groupingItemPage.assertChildren(0, [spec.unnamedChildText]);
                groupingItemPage.sheethasTitle(spec.unnamedChildText);
                groupingItemPage.renameSelectedChild(spec.unnamedChildText, CHILD_TITLE, false);   
            });
        
            it('can rename child', () => {
                groupingItemPage.assertChildren(0, [spec.unnamedChildText]);
                groupingItemPage.sheethasTitle(spec.unnamedChildText);
                groupingItemPage.renameSelectedChild(spec.unnamedChildText, CHILD_TITLE, true);   
            });
                   
            it('can cancel update child summary', () => {
                groupingItemPage.assertChildren(0, [CHILD_TITLE]);
                groupingItemPage.sheethasTitle(CHILD_TITLE);
                groupingItemPage.sheethasSummary(spec.missingSummaryChildText);
                groupingItemPage.sheethasExtendedSummary(spec.missingExtendedSummaryChildText);
                groupingItemPage.updateSummaryForSelectedChild(spec.missingSummaryChildText, CHILD_SUMMARY, false);   
            });

            it('can update child summary', () => {
                groupingItemPage.assertChildren(0, [CHILD_TITLE]);
                groupingItemPage.sheethasTitle(CHILD_TITLE);
                groupingItemPage.sheethasSummary(spec.missingSummaryChildText);
                groupingItemPage.sheethasExtendedSummary(spec.missingExtendedSummaryChildText);
                groupingItemPage.updateSummaryForSelectedChild(spec.missingSummaryChildText, CHILD_SUMMARY)
            });

            it('can cancel update extended child summary', () => {
                groupingItemPage.assertChildren(0, [CHILD_TITLE]);
                groupingItemPage.assertChildren(0, [CHILD_SUMMARY]);
                groupingItemPage.sheethasTitle(CHILD_TITLE);
                groupingItemPage.sheethasSummary(CHILD_SUMMARY);
                groupingItemPage.sheethasExtendedSummary(spec.missingExtendedSummaryChildText);
                groupingItemPage.updateExtendedSummaryForSelectedChild(spec.missingExtendedSummaryChildText, EXTENDED_CHILD_SUMMARY, false);   
            });

            it('can update child extended summary', () => {
                groupingItemPage.assertChildren(0, [CHILD_TITLE]);
                groupingItemPage.assertChildren(0, [CHILD_SUMMARY]);
                groupingItemPage.sheethasTitle(CHILD_TITLE);
                groupingItemPage.sheethasSummary(CHILD_SUMMARY);
                groupingItemPage.sheethasExtendedSummary(spec.missingExtendedSummaryChildText);
                groupingItemPage.updateExtendedSummaryForSelectedChild(spec.missingExtendedSummaryChildText, EXTENDED_CHILD_SUMMARY)
            });

            it('can update content', () => {
                groupingItemPage.assertChildren(0, [CHILD_TITLE]);
                groupingItemPage.assertChildren(0, [CHILD_SUMMARY]);
                groupingItemPage.sheethasTitle(CHILD_TITLE);
                groupingItemPage.sheethasSummary(CHILD_SUMMARY);
                groupingItemPage.sheethasExtendedSummary(EXTENDED_CHILD_SUMMARY);
                groupingItemPage.updateContentForSelectedChild(spec.missingContentChildText, CHILD_CONTENT);
            });

            it('should remember content', () => {
                groupingItemPage.assertChildren(0, [CHILD_TITLE]);
                groupingItemPage.assertChildren(0, [CHILD_SUMMARY]);
                groupingItemPage.sheethasTitle(CHILD_TITLE);
                groupingItemPage.sheethasSummary(CHILD_SUMMARY);
                groupingItemPage.sheethasExtendedSummary(EXTENDED_CHILD_SUMMARY);
                groupingItemPage.sheethasContent(CHILD_CONTENT);                
            });
        });
    };
});