import { setStoreItem, getStoreItem, deleteStoreItem } from "lib/store"

export interface LDBStorage {
    setItem: (value: any) => Promise<void>
    getItem: <T extends object>(keyValue: any) => Promise<T>
    removeItem: (keyValue: any) => Promise<void>
}

async function setItem(database: string, store: string, value: object) {
    await setStoreItem(database, store, value)
}

async function getItem<T extends object>(database: string, store: string, keyValue: any) {
    return await getStoreItem<T>(database, store, keyValue)
}

async function removeItem(database: string, store: string, keyValue: any) {
    await deleteStoreItem(database, store, keyValue)
}

export function storage(name: string, store: string) {
    return {
        setItem: (value: any) => setItem(name, store, value),
        getItem: <T extends object>(keyValue: any) => getItem<T>(name, store, keyValue),
        removeItem: (keyValue: any) => removeItem(name, store, keyValue)
    } as LDBStorage
}