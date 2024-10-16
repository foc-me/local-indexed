import { getTransaction, getObjectStore } from "./database"

/**
 * put store value
 * 
 * @param database database name
 * @param storeName store name
 * @param value store value
 * @returns promise void
 */
export function setStoreItem(database: string, store: string, value: object): Promise<void> {
    return new Promise(async (resolve, reject) => {
        const [transaction, close] = await getTransaction(database, store, "readwrite")
        const objectStore = transaction.objectStore(store)

        objectStore.put(value)

        transaction.addEventListener("complete", () => {
            close()
            resolve()
        })
        transaction.addEventListener("error", error => {
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