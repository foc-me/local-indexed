/**
 * get transaction from database with specified stores
 * 
 * @param database database
 * @param stores store names
 * @param mode transaction mode
 * @returns transaction
 */
export function getTransaction(database: IDBDatabase, stores: string | Iterable<string>, mode?: IDBTransactionMode) {
    return database.transaction(stores, mode || "readonly")
}

/**
 * get store from database
 * 
 * @param database database
 * @param store store name
 * @param mode transaction mode
 * @returns store
 */
function getObjectStore(database: IDBDatabase, store: string, mode?: IDBTransactionMode) {
    const transaction = getTransaction(database, store, mode)
    return transaction.objectStore(store)
}

/**
 * put store value
 * 
 * @param database database
 * @param storeName store name
 * @param value store value
 * @returns promise void
 */
export function setStoreItem(database: IDBDatabase, store: string, value: object): Promise<void> {
    return new Promise(async (resolve, reject) => {
        const transaction = getTransaction(database, store, "readwrite")
        const objectStore = transaction.objectStore(store)

        objectStore.put(value)

        transaction.addEventListener("complete", () => {
            resolve()
        })
        transaction.addEventListener("error", error => {
            reject(error)
        })
    })
}

/**
 * get store value
 * 
 * @param database database
 * @param store store name
 * @param keyValue store key value
 * @returns store value
 */
export function getStoreItem<T extends object>(database: IDBDatabase, store: string, keyValue: any): Promise<T | null> {
    return new Promise(async (resolve, reject) => {
        const objectStore = getObjectStore(database, store)
        const request = objectStore.get(keyValue)

        request.addEventListener("success", () => {
            resolve(request.result)
        })
        request.addEventListener("error", error => {
            reject(error)
        })
    })
}

/**
 * delete store value
 * 
 * @param database database
 * @param store store name
 * @param keyValue store key value
 * @returns promise void
 */
export function deleteStoreItem(database: IDBDatabase, store: string, keyValue: any): Promise<void> {
    return new Promise(async (resolve, reject) => {
        const objectStore = getObjectStore(database, store, "readwrite")
        const request = objectStore.delete(keyValue)

        request.addEventListener("success", () => {
            resolve()
        })
        request.addEventListener("error", error => {
            reject(error)
        })
    })
}