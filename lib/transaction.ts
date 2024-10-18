import { getDatabase } from "./database"

/**
 * get transaction from database with specified stores
 * 
 * @param database database name
 * @param stores store names
 * @param mode transaction mode
 * @param indexedDB indexedDB factory engine
 * @returns transaction
 */
export async function getTransaction(
    database: string,
    stores: string | Iterable<string>,
    mode?: IDBTransactionMode,
    indexedDB?: IDBFactory
) {
    const db = await getDatabase(database, indexedDB)
    return db.transaction(stores, mode || "readonly")
}

/**
 * take object transaction actions
 * 
 * actions come from IDBTransaction
 * 
 * the return value depends on actions
 * 
 * @param database database name
 * @param stores store names
 * @param mode transaction mode
 * @param callback action callback
 * @param indexedDB indexedDB factory engine
 * @returns promise unknown
 */
export function transactionAction<T>(
    database: string,
    stores: string | Iterable<string>,
    mode: IDBTransactionMode,
    callback: (transaction: IDBTransaction) => IDBRequest | void,
    indexedDB?: IDBFactory
): Promise<T> {
    return new Promise(async (resolve, reject) => {
        try {
            const transaction = await getTransaction(database, stores, mode, indexedDB)
            const request = callback(transaction)
            transaction.addEventListener("complete", () => {
                transaction.db.close()
                resolve((request ? request.result : undefined) as T)
            })
            transaction.addEventListener("error", (error) => {
                transaction.db.close()
                reject(error)
            })
        } catch (error) {
            reject(error)
        }
    })
}