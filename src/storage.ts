import { setStoreItem, getStoreItem, deleteStoreItem, countStoreItems, clearStore } from "lib/store"

/**
 * storage for database object store
 */
export interface LDBStorage {
    /**
     * set value to the store
     * 
     * @param value stored value
     * @returns promise void
     */
    setItem: (value: any) => Promise<void>

    /**
     * get value from the store
     * 
     * @param keyValue key path value of the store
     * @returns promise value
     */
    getItem: <T extends object>(keyValue: any) => Promise<T>

    /**
     * remove value from the store
     * 
     * @param keyValue key path value of the store
     * @returns promise void
     */
    removeItem: (keyValue: any) => Promise<void>

    /**
     * count values from the store
     * 
     * @returns promise length
     */
    length: () => Promise<number>

    /**
     * clear the store
     * 
     * @returns promise void
     */
    clear: () => Promise<void>
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

async function length(database: string, store: string) {
    return await countStoreItems(database, store)
}

async function clear(database: string, store: string) {
    await clearStore(database, store)
}

export function storage(database: string, store: string) {
    return {
        setItem: (value: any) => setItem(database, store, value),
        getItem: <T extends object>(keyValue: any) => getItem<T>(database, store, keyValue),
        removeItem: (keyValue: any) => removeItem(database, store, keyValue),
        length: () => length(database, store),
        clear: () => clear(database, store)
    } as LDBStorage
}