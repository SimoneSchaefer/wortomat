export enum STATUS {
    TODO, 
    IDEA, 
    OUTLINE, 
    FIRST_DRAFT,
    REVISED_DRAFT,
    DONE
}

export const STATUS_TO_ICON = {
    [STATUS.TODO]: 'question',
    [STATUS.IDEA]: 'lightbulb',
    [STATUS.OUTLINE]: 'bars',
    [STATUS.FIRST_DRAFT]: 'check',
    [STATUS.REVISED_DRAFT]: 'check-double',
    [STATUS.DONE]: 'heart',    
}
export const STATUS_TO_TRANSLATION = {
    [STATUS.TODO]: 'rating.no_rating',
    [STATUS.IDEA]: 'rating.idea',
    [STATUS.OUTLINE]: 'rating.outline',
    [STATUS.FIRST_DRAFT]: 'rating.first_draft',
    [STATUS.REVISED_DRAFT]: 'rating.revised_draft',
    [STATUS.DONE]: 'rating.done',    
}