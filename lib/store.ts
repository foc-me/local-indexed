import { getDatabase, type IDBDatabaseCloser } from "./database"

/**
 * get database store names
 * 
 * @param name database name
 * @returns database store names
 */
export async function getStores(name: string) {
    const [database, close] = await getDatabase(name)
    close()
    return [...database.objectStoreNames]
}

/**
 * exist of the store in database
 * 
 * @param databaseName database name
 * @param storeName store name
 * @returns whether store exists
 */
export async function existsStore(databaseName: string, storeName: string) {
    const stores = await getStores(databaseName)
    return stores.includes(storeName)
}

/**
 * get transaction context from database with specified stores
 * 
 * @param databaseName database name
 * @param storeNames store names
 * @param mode transaction mode
 * @returns transaction context
 */
async function getTransaction(databaseName: string, storeNames: string | Iterable<string>, mode?: IDBTransactionMode) {
    const [database, close] = await getDatabase(databaseName)
    const transaction = database.transaction(storeNames, mode || "readonly")
    return [transaction, close] as [IDBTransaction, IDBDatabaseCloser]
}

/**
 * get store context from database
 * 
 * @param databaseName database name
 * @param storeName store name
 * @param mode transaction mode
 * @returns store context
 */
async function getStore(databaseName: string, storeName: string, mode?: IDBTransactionMode) {
    const [transaction, close] = await getTransaction(databaseName, storeName, mode || "readonly")
    const store = transaction.objectStore(storeName)
    return [store, close] as [IDBObjectStore, IDBDatabaseCloser]
}

/**
 * put store value
 * 
 * @param databaseName database name
 * @param storeName store name
 * @param value store value
 * @returns promise void
 */
export function setStoreItem(databaseName: string, storeName: string, value: object): Promise<void> {
    return new Promise(async (resolve, reject) => {
        const [transaction, close] = await getTransaction(databaseName, storeName, "readwrite")
        const store = transaction.objectStore(storeName)

        store.put(value)

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
 * @param databaseName database name
 * @param storeName store name
 * @param keyValue store key value
 * @returns store value
 */
export function getStoreItem<T extends object>(databaseName: string, storeName: string, keyValue: any): Promise<T | null> {
    return new Promise(async (resolve, reject) => {
        const [store, close] = await getStore(databaseName, storeName)
        const request = store.get(keyValue)
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
 * @param databaseName database name
 * @param storeName store name
 * @param keyValue store key value
 * @returns promise void
 */
export function deleteStoreItem(databaseName: string, storeName: string, keyValue: any): Promise<void> {
    return new Promise(async (resolve, reject) => {
        const [store, close] = await getStore(databaseName, storeName, "readwrite")
        const request = store.delete(keyValue)

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