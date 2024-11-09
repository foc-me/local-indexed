import { getDatabase } from "./database"

/**
 * get transaction from database with specified stores
 * 
 * @param database database name
 * @param stores store names
 * @param mode transaction mode
 * @param options transaction options
 * @param indexedDB indexedDB factory engine
 * @returns transaction
 */
export async function getTransaction(
    database: string,
    stores: string | Iterable<string>,
    mode?: IDBTransactionMode,
    options?: IDBTransactionOptions,
    indexedDB?: IDBFactory
) {
    const db = await getDatabase(database, indexedDB)
    try {
        return db.transaction(stores, mode || "readonly", options)
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
 * @param transaction transaction
 * @param callback action callback
 * @returns promise unknown
 */
export function transactionAction<T>(
    transaction: IDBTransaction,
    callback: () => IDBRequest | void
): Promise<T> {
    return new Promise(async (resolve, reject) => {
        try {
            const request = callback()
            transaction.addEventListener("complete", () => {
                transaction.db.close()
                resolve((request ? request.result : undefined) as T)
            })
            transaction.addEventListener("error", (error) => {
                transaction.db.close()
                reject(error)
            })
            transaction.addEventListener("abort", (error) => {
                transaction.db.close()
                reject(error)
            })
        } catch (error) {
            transaction.db.close()
            reject(error)
        }
    })
}

export function requestAction<T>(callback: () => IDBRequest) {
    return new Promise<T>(async (resolve, reject) => {
        const request = callback()
        request.addEventListener("success", () => {
            resolve(request.result)
        })
        request.addEventListener("error", (error) => {
            reject(error)
        })
    })
}