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
    try {
        return db.transaction(stores, mode || "readonly")
    } catch (error) {
        // should always close the database connection
        db.close()
        throw error
    }
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
    callback: (transaction: IDBTransaction) => IDBRequest | void,
    mode?: IDBTransactionMode,
    indexedDB?: IDBFactory
): Promise<T> {
    return new Promise(async (resolve, reject) => {
        // should always close the database connection
        try {
            const transaction = await getTransaction(database, stores, mode, indexedDB)
            try {
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
                transaction.db.close()
                reject(error)
            }
        } catch (error) {
            reject(error)
        }
    })
}