import { storeAction } from "../store"

export async function countStore(database: string, store: string) {
    return await storeAction<number>(database, store, "readonly", (objectStore) => {
        return objectStore.count()
    })
}

export async function getStoreItem<T extends object>(database: string, store: string, keyValue: IDBValidKey) {
    return await storeAction<T>(database, store, "readonly", (objectStore) => {
        return objectStore.get(keyValue)
    })
}