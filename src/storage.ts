import { getDatabase } from "lib/database"
import { setStoreItem, getStoreItem, deleteStoreItem } from "lib/store"

export interface LDBStorage {
    setItem: (value: any) => Promise<void>
    getItem: <T extends object>(keyValue: any) => Promise<T>
    removeItem: (keyValue: any) => Promise<void>
}

async function setItem(name: string, store: string, value: object) {
    const [database, close] = await getDatabase(name)
    await setStoreItem(database, store, value)
    close()
}

async function getItem<T extends object>(name: string, store: string, keyValue: any) {
    const [database, close] = await getDatabase(name)
    const result = await getStoreItem<T>(database, store, keyValue)
    close()
    return result
}

async function removeItem(name: string, store: string, keyValue: any) {
    const [database, close] = await getDatabase(name)
    await deleteStoreItem(database, store, keyValue)
    close()
}

export function storage(name: string, store: string) {
    return {
        setItem: (value: any) => setItem(name, store, value),
        getItem: <T extends object>(keyValue: any) => getItem<T>(name, store, keyValue),
        removeItem: (keyValue: any) => removeItem(name, store, keyValue)
    } as LDBStorage
}