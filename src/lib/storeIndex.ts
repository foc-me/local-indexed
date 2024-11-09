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
    options?: IDBTransactionOptions,
    indexedDB?: IDBFactory
) {
    const transaction = await getTransaction(database, store, "readonly", options, indexedDB)
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
    callback: (storeIndex: IDBIndex) => IDBRequest | void,
    mode?: IDBTransactionMode,
    options?: IDBTransactionOptions,
    indexedDB?: IDBFactory
): Promise<T> {
    const transaction = await getTransaction(database, store, mode, options, indexedDB)
    return await transactionAction<T>(transaction, () => {
        const objectStore = transaction.objectStore(store)
        // if the index does not exist
        // objectStore.index will threw a NotFoundError
        const storeIndex = objectStore.index(index)
        return callback(storeIndex)
    })
}