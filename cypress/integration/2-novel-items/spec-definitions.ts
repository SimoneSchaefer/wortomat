
interface NovelItemSpec {
    specName: string,
    index: number,
    hasImage: boolean,
    unnamedParentText: string,
    unnamedChildText: string,
    emptyParentInfo: string,
    emptyChildInfo: string
}

export const novelItemsSpecDefinition: NovelItemSpec[] = [{
        specName: 'parts / chapters',
        index: 1,
        hasImage: false,
        unnamedParentText: 'Unnamed part',
        unnamedChildText: 'Unnamed chapter',
        emptyParentInfo: 'to create a new part',
        emptyChildInfo: 'Create a new chapter by'
    },{
        specName: 'characters',
        index: 2,
        hasImage: false,
        unnamedParentText: 'Unnamed character group',
        unnamedChildText: 'Unnamed character',
        emptyParentInfo: 'reate a new character group',
        emptyChildInfo: 'Create a new character by'
    }
]
