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
    callback: (store: IDBObjectStore) => IDBRequest | void,
    mode?: IDBTransactionMode,
    indexedDB?: IDBFactory
): Promise<T> {
    // createIndex and deleteIndex can only work in upgradeneeded callback
    // these two apis will threw error in normal situation
    return await transactionAction<T>(database, store, (transaction) => {
        return callback(transaction.objectStore(store))
    }, mode, indexedDB)
}