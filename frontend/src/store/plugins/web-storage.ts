import mutations from "../mutations";

const keysToStore = [
    'displaySettingsUpdated'
]

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

}