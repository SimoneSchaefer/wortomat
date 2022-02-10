
const keysToStore = {
    'displaySettings/_displaySettings': 'displaySettings/updateDisplaySettings',

}

const setupLocalStorage = (store) => {
    console.log('store', store)
    for (const key of Object.keys(keysToStore)) {
        console.log('key is ', key)
        console.log('key is ', localStorage.getItem(keysToStore[key]))
        const item = localStorage.getItem(keysToStore[key]);
        if (item) {
            console.log('HARR GARR')
            store._state.data.displaySettings = JSON.parse(item);
          // store.commit(keysToStore[key], JSON.parse(item));
        }
    }

}

const VuexLocalStorage = (store) => {

	setupLocalStorage(store);

    store.subscribe((mutation, state) => {
        if (Object.values(keysToStore).includes(mutation.type)) {
            const payload = mutation.payload;
            localStorage.setItem(mutation.type, JSON.stringify(payload));
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