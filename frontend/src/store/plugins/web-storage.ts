
const keysToStore = [
    'displaySettings/updateDisplaySettings',
    'treeState/itemsToggled'
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


/*
export default VuexLocalStorage;

export default function saveToLocalStorage(store) {
    store.subscribe((mutation, state) => {
        if (keysToStore.includes(mutation.type)) {
            const payload = mutation.payload;
            localStorage.setItem(mutation.type, JSON.stringify(payload));
        }
    })
}

export function getFromLocalStorage(key: string) {
    const inStorage = localStorage.getItem(key);
    if (inStorage) {
        return JSON.parse(inStorage);
    }
    return undefined;

}*/