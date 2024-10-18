import { storeAction } from "lib/store"

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
    setItem: (value: object) => Promise<IDBValidKey>

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

async function setItem<T extends IDBValidKey>(database: string, store: string, value: object) {
    return await storeAction<T>(database, store, "readwrite", (objectStore) => {
        return objectStore.put(value)
    })
}

async function getItem<T extends object>(database: string, store: string, keyValue: any) {
    return await storeAction<T | undefined>(database, store, "readonly", (objectStore) => {
        return objectStore.get(keyValue)
    })
}

async function removeItem(database: string, store: string, keyValue: any) {
    return await storeAction<void>(database, store, "readwrite", (objectStore) => {
        return objectStore.delete(keyValue)
    })
}

async function length(database: string, store: string) {
    return await storeAction<number>(database, store, "readonly", (objectStore) => {
        return objectStore.count()
    })
}

async function clear(database: string, store: string) {
    return await storeAction<void>(database, store, "readwrite", (objectStore) => {
        return objectStore.clear()
    })
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