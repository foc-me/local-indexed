import { getIndexedDB } from "./indexed"

/**
 * close database
 */
export type IDBDatabaseCloser = () => void
/**
 * database context
 */
export type IDBDatabaseContext = [IDBDatabase, IDBDatabaseCloser]

/**
 * get the specified database
 * 
 * @param name database name
 * @param version database version
 * @returns promise database and close function
 */
export function getDatabase(name: string): Promise<IDBDatabaseContext> {
    return new Promise((resolve, reject) => {
        const indexed = getIndexedDB()
        const request = indexed.open(name)
        request.addEventListener("success", () => {
            const { result } = request
            // always close database after any action
            resolve([result, () => { result.close() }])
        })
        request.addEventListener("error", error => {
            reject(error)
        })
    })
}

/**
 * get version of the specified database
 * 
 * @param name database name
 * @returns promise version
 */
export async function getVersion(name: string) {
    const [database, close] = await getDatabase(name)
    close()
    return database.version
}

/**
 * get database store names
 * 
 * @param name database name
 * @returns store names
 */
export async function getStoreNames(name: string) {
    const [database, close] = await getDatabase(name)
    close()
    return [...database.objectStoreNames]
}

/**
 * get transaction from database with specified stores
 * 
 * @param database database name
 * @param stores store names
 * @param mode transaction mode
 * @returns transaction
 */
export async function getTransaction(database: string, stores: string | Iterable<string>, mode?: IDBTransactionMode) {
    const [db, close] = await getDatabase(database)
    const transaction = db.transaction(stores, mode || "readonly")
    return [transaction, close] as [IDBTransaction, IDBDatabaseCloser]
}

/**
 * get object store from database
 * 
 * @param database database name
 * @param store store name
 * @param mode transaction mode
 * @returns store
 */
export async function getObjectStore(database: string, store: string, mode?: IDBTransactionMode) {
    const [transaction, close] = await getTransaction(database, store, mode)
    const objectStore = transaction.objectStore(store)
    return [objectStore, close] as [IDBObjectStore, IDBDatabaseCloser]
}