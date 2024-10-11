import { setStoreItem, getStoreItem, deleteStoreItem } from "lib/store"

export interface LDBStore {
    setItem: (value: any) => Promise<void>
    getItem: <T extends object>(keyValue: any) => Promise<T>
    removeItem: (keyValue: any) => Promise<void>
}

export function store(database: string, name: string) {
    return {
        setItem: (value: any) => setStoreItem(database, name, value),
        getItem: <T extends object>(key: any) => getStoreItem<T>(database, name, key),
        removeItem: (key: any) => deleteStoreItem(database, name, key)
    } as LDBStore
}