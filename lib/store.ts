import { getObjectStore } from "./database"

/**
 * put store value
 * 
 * @param database database name
 * @param storeName store name
 * @param value store value
 * @returns promise unkown
 */
export function setStoreItem<T>(database: string, store: string, value: object): Promise<T> {
    return new Promise(async (resolve, reject) => {
        const [objectStore, close] = await getObjectStore(database, store, "readwrite")
        const request = objectStore.put(value)

        request.addEventListener("success", () => {
            close()
            resolve(request.result as T)
        })
        request.addEventListener("error", error => {
            close()
            reject(error)
        })
    })
}

/**
 * get store value
 * 
 * @param database database name
 * @param store store name
 * @param keyValue store key value
 * @returns store value
 */
export function getStoreItem<T extends object>(database: string, store: string, keyValue: any): Promise<T | undefined> {
    return new Promise(async (resolve, reject) => {
        const [objectStore, close] = await getObjectStore(database, store)
        const request = objectStore.get(keyValue)

        request.addEventListener("success", () => {
            close()
            resolve(request.result)
        })
        request.addEventListener("error", error => {
            close()
            reject(error)
        })
    })
}

/**
 * delete store value
 * 
 * @param database database name
 * @param store store name
 * @param keyValue store key value
 * @returns promise void
 */
export function deleteStoreItem(database: string, store: string, keyValue: any): Promise<void> {
    return new Promise(async (resolve, reject) => {
        const [objectStore, close] = await getObjectStore(database, store, "readwrite")
        const request = objectStore.delete(keyValue)

        request.addEventListener("success", () => {
            close()
            resolve()
        })
        request.addEventListener("error", error => {
            close()
            reject(error)
        })
    })
}

/**
 * count values from the store
 * 
 * @param database database name
 * @param store store name
 * @returns promise number
 */
export function countStoreItems(database: string, store: string): Promise<number> {
    return new Promise(async (resolve, reject) => {
        const [objectStore, close] = await getObjectStore(database, store)
        const request = objectStore.count()

        request.addEventListener("success", () => {
            close()
            resolve(request.result)
        })
        request.addEventListener("error", error => {
            close()
            reject(error)
        })
    })
}


/**
 * clear the store
 * 
 * @param database database name
 * @param store store name
 * @returns promise void
 */
export function clearStore(database: string, store: string): Promise<void> {
    return new Promise(async (resolve, reject) => {
        const [objectStore, close] = await getObjectStore(database, store, "readwrite")
        const request = objectStore.clear()

        request.addEventListener("success", () => {
            close()
            resolve()
        })
        request.addEventListener("error", error => {
            close()
            reject(error)
        })
    })
}