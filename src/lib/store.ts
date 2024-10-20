import { getDatabase } from "./database"
import { transactionAction } from "./transaction"

/**
 * get database store names
 * 
 * @param name database name
 * @param indexedDB indexedDB factory engine
 * @returns store names
 */
export async function getStoreNames(database: string, indexedDB?: IDBFactory) {
    const db = await getDatabase(database, indexedDB)
    db.close()
    return [...db.objectStoreNames]
}

/**
 * take object store actions
 * 
 * actions come from IBDObjectStore
 * 
 * the return value depends on actions
 * 
 * @param database database name
 * @param store store name
 * @param mode transaction mode
 * @param callback action callback
 * @param indexedDB indexedDB factory engine
 * @returns promise unknown
 */
export async function storeAction<T>(
    database: string,
    store: string,
    mode: IDBTransactionMode,
    callback: (store: IDBObjectStore) => IDBRequest,
    indexedDB?: IDBFactory
): Promise<T> {
    return await transactionAction<T>(database, store, mode, (transaction) => {
        return callback(transaction.objectStore(store))
    }, indexedDB)
    // return new Promise(async (resolve, reject) => {
    //     try {
    //         const transaction = await getTransaction(database, store, mode, indexedDB)
    //         const objectStore = transaction.objectStore(store)
    //         const request = callback(objectStore)
    //         request.addEventListener("success", () => {
    //             transaction.db.close()
    //             resolve(request.result as T)
    //         })
    //         request.addEventListener("error", error => {
    //             transaction.db.close()
    //             reject(error)
    //         })
    //     } catch (error) {
    //         reject(error)
    //     }
    // })
}