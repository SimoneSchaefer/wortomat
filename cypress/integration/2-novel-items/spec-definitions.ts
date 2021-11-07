
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
        emptyParentInfo: 'reate a new part',
        emptyChildInfo: 'reate a new chapter'
    },{
        specName: 'characters',
        index: 2,
        hasImage: true,
        unnamedParentText: 'Unnamed character group',
        unnamedChildText: 'Unnamed character',
        emptyParentInfo: 'reate a new character group',
        emptyChildInfo: 'reate a new character'
    },{
        specName: 'research',
        index: 3,
        hasImage: false,
        unnamedParentText: 'Unnamed research group',
        unnamedChildText: 'Unnamed research item',
        emptyParentInfo: 'reate a new research group',
        emptyChildInfo: 'reate a new research item'
    },{
        specName: 'locations',
        index: 4,
        hasImage: false,
        unnamedParentText: 'Unnamed location group',
        unnamedChildText: 'Unnamed location',
        emptyParentInfo: 'reate a new location group',
        emptyChildInfo: 'reate a new location'
    }
]
