export enum PARENT_ITEM_KEYS {
    PARTS = 'PARTS',
    RESEARCH_GROUPS = 'RESEARCH_GROUPS',
    CHARACTER_GROUPS = 'CHARACTER_GROUPS',
    LOCATION_GROUPS = 'LOCATION_GROUPS',
    TIMELINE = 'TIMELINE',
    TAGS = 'TAGS',
    PLOTLINES = 'PLOTLINES',
    STATS = 'PLOTLINES'
}

export enum CHILD_ITEM_KEYS {
    CHAPTERS = 'CHAPTERS',
    RESEARCH = 'RESEARCH',
    CHARACTERS = 'CHARACTERS',
    LOCATIONS = 'LOCATIONS',
    PLOTLINE_EVENTS = 'PLOTLINE_EVENTS'
}

export const PARENT_TO_CHILD: Map<PARENT_ITEM_KEYS,CHILD_ITEM_KEYS> = new Map([
    [PARENT_ITEM_KEYS.PARTS, CHILD_ITEM_KEYS.CHAPTERS],
    [PARENT_ITEM_KEYS.RESEARCH_GROUPS, CHILD_ITEM_KEYS.RESEARCH],
    [PARENT_ITEM_KEYS.CHARACTER_GROUPS, CHILD_ITEM_KEYS.CHARACTERS],
    [PARENT_ITEM_KEYS.LOCATION_GROUPS, CHILD_ITEM_KEYS.LOCATIONS],
    [PARENT_ITEM_KEYS.PLOTLINES, CHILD_ITEM_KEYS.PLOTLINE_EVENTS]
])

export const childKeyForParentKey = (parentKey: PARENT_ITEM_KEYS) => {
    return PARENT_TO_CHILD.get(parentKey);
}

export const parentKeyForChildKey = (childKey: CHILD_ITEM_KEYS) => {
    for (const key of PARENT_TO_CHILD.keys()) {
        if (PARENT_TO_CHILD.get(key) === childKey) {
            return key;
        }
    }
    return undefined;
}

/**
 * TODO GENERATE FROM PARENTS AND CHILDREN or remove
 * @deprecated
 */
export enum NOVEL_ITEM_KEYS {
    NOVELS = 'NOVELS',
    PARTS = 'PARTS',
    CHAPTERS = 'CHAPTERS',
    RESEARCH_GROUPS = 'RESEARCH_GROUPS',
    RESEARCH = 'RESEARCH',
    CHARACTER_GROUPS = 'CHARACTER_GROUPS',
    CHARACTERS = 'CHARACTERS',
    LOCATION_GROUPS = 'LOCATION_GROUPS',
    LOCATIONS = 'LOCATIONS',
    TAGS = 'TAGS',
    TIMELINE = 'TIMELINE'
}

export enum DISPLAY_SETTINGS_KEYS {
    SHOW_TITLE = 'SHOW_TITLE',
    SHOW_SUMMARY = 'SHOW_SUMMARY',
    SHOW_EXTENDED_SUMMARY = 'SHOW_EXTENDED_SUMMARY',
    SHOW_TAGS = 'SHOW_TAGS',
    SHOW_IMAGES = 'SHOW_IMAGES',
    SHOW_CONTENT = 'SHOW_CONTENT',
    SHOW_RATING = 'SHOW_RATING'
}