
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
        hasImage: true,
        unnamedParentText: 'Unnamed character group',
        unnamedChildText: 'Unnamed character',
        emptyParentInfo: 'reate a new character group',
        emptyChildInfo: 'Create a new character by'
    },{
        specName: 'research',
        index: 3,
        hasImage: false,
        unnamedParentText: 'Unnamed research group',
        unnamedChildText: 'Unnamed research item',
        emptyParentInfo: 'You haven\'t created any research groups yet',
        emptyChildInfo: 'Create a new research item by '
    },{
        specName: 'locations',
        index: 4,
        hasImage: false,
        unnamedParentText: 'Unnamed location group',
        unnamedChildText: 'Unnamed location',
        emptyParentInfo: 'Create a new location group by',
        emptyChildInfo: 'Create a new location by'
    }
]
