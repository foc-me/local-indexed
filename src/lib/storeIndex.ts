import { getTransaction, transactionAction } from "./transaction"

/**
 * get database store index names
 * 
 * @param database database name
 * @param store store name
 * @param indexedDB indexedDB factory engine
 * @returns promise index names
 */
export async function getStoreIndexNames(
    database: string,
    store: string,
    indexedDB?: IDBFactory
) {
    const transaction = await getTransaction(database, store, "readonly", indexedDB)
    const objectStore = transaction.objectStore(store)
    transaction.db.close()
    return [...objectStore.indexNames]
}

/**
 * take object store index actions
 * 
 * actions come from IDBIndex
 * 
 * the return value depends on actions
 * 
 * @param database database name
 * @param store store name
 * @param index index name
 * @param mode transaction mode
 * @param callback action callback
 * @param indexedDB indexedDB factory engine
 * @returns promise unknown
 */
export async function indexAction<T>(
    database: string,
    store: string,
    index: string,
    mode: IDBTransactionMode,
    callback: (storeIndex: IDBIndex) => IDBRequest,
    indexedDB?: IDBFactory
): Promise<T> {
    return await transactionAction<T>(database, store, mode, (transaction) => {
        const objectStore = transaction.objectStore(store)
        const storeIndex = objectStore.index(index)
        return callback(storeIndex)
    }, indexedDB)
}