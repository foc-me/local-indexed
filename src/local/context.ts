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
     * database factory
     */
    indexedDB: IDBFactory | undefined
    /**
     * create database
     */
    makeDatabase(): Promise<IDBDatabase>
    /**
     * get the cached transaction
     */
    getTransaction(): IDBTransaction | undefined
    /**
     * cache the transaction that other functions could use it
     * 
     * @param target transaction
     */
    setTransaction(target?: IDBTransaction): void
    /**
     * create transaction
     * 
     * @param store store name
     * @param mode transaction mode
     * @param option transaction option
     */
    makeTransaction(
        store: string | string[],
        mode?: IDBTransactionMode,
        option?: IDBTransactionOptions
    ): Promise<IDBTransaction>
    /**
     * abort the transaction
     */
    abort(): void
    /**
     * close database connection
     */
    close(): void
}

export function makeContext(database: string, indexedDB?: IDBFactory, transaction?: IDBTransaction) {
    const current ={ value: transaction }

    const makeDatabase = async () => {
        return await getDatabase(database, indexedDB)
    }

    const setTransaction = (transaction?: IDBTransaction) => {
        if (current.value) {
            current.value.db.close()
        }
        current.value = transaction
    }

    const makeTransaction = async (store: string | string[], mode?: IDBTransactionMode, option?: IDBTransactionOptions) => {
        const database = await makeDatabase()
        const transaction = database.transaction(store, mode, option)
        setTransaction(transaction)
        return transaction
    }

    return {
        database,
        indexedDB,
        makeDatabase,
        getTransaction: () => current.value,
        makeTransaction,
        setTransaction,
        abort: () => {
            if (current.value) {
                current.value.abort()
            }
        },
        close: () => {
            setTransaction()
        }
    } as LDBContext
}