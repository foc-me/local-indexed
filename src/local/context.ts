import { getDatabase } from "../lib/database"

/**
 * indexedDB context
 */
export interface LDBContext {
    /**
     * database name
     */
    database: string
    /**
     * indexedDB factory
     */
    indexedDB?: IDBFactory
    /**
     * current transaction
     */
    transaction?: IDBTransaction
    /**
     * get current transaction
     * 
     * @param store store name
     * @param mode transaction mode
     * @param options transaction options
     */
    getTransaction(
        store: string | string[],
        mode?: IDBTransactionMode,
        options?: IDBTransactionOptions
    ): Promise<IDBTransaction>
}

export function makeContext(database: string, indexedDB?: IDBFactory, transaction?: IDBTransaction) {
    return {
        database,
        indexedDB,
        transaction,
        getTransaction: async (store, mode?, options?) => {
            const db = await getDatabase(database, indexedDB)
            try {
                return db.transaction(store, mode, options)
            } catch (error) {
                db.close()
                throw error
            }
        }
    } as LDBContext
}