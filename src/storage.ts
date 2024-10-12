import { getDatabase } from "lib/database"
import { setStoreItem, getStoreItem, deleteStoreItem } from "lib/store"

export interface LDBStorage {
    setItem: (value: any) => Promise<void>
    getItem: <T extends object>(keyValue: any) => Promise<T>
    removeItem: (keyValue: any) => Promise<void>
}

async function setItem(name: string, version: number, store: string, value: object) {
    const [database, close] = await getDatabase(name, version)
    await setStoreItem(database, store, value)
    close()
}

async function getItem<T extends object>(name: string, version: number, store: string, keyValue: any) {
    const [database, close] = await getDatabase(name, version)
    const result = await getStoreItem<T>(database, store, keyValue)
    close()
    return result
}

async function removeItem(name: string, version: number, store: string, keyValue: any) {
    const [database, close] = await getDatabase(name, version)
    await deleteStoreItem(database, store, keyValue)
    close()
}

export function storage(name: string, version: number, store: string) {
    return {
        setItem: (value: any) => setItem(name, version, store, value),
        getItem: <T extends object>(keyValue: any) => getItem<T>(name, version, store, keyValue),
        removeItem: (keyValue: any) => removeItem(name, version, store, keyValue)
    } as LDBStorage
}