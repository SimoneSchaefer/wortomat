
const keysToStore = [
    'displaySettings/updateDisplaySettings',
    'treeState/itemsToggled',
    'selection/itemsSelected',
    'export/updateExportIncludes',
    'export/updateExportFormat'
]

export const setupLocalStorage = (store) => {
    for (const key of keysToStore) {
        const item = localStorage.getItem(key);
        if (item) {
            store.commit(key, JSON.parse(item));
        }
    }

}

const VuexLocalStorage = (store) => {
    store.subscribe((mutation, _state) => {
        if (Object.values(keysToStore).includes(mutation.type)) {
            localStorage.setItem(mutation.type, JSON.stringify(mutation.payload));
        }
    })
}

export default VuexLocalStorage;
