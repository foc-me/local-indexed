import { getDatabase } from "./lib/database"

/**
 * indexed context
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
     * get global transaction
     */
    getTransaction(): IDBTransaction | undefined
    /**
     * set global transaction
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
     * abort transaction
     */
    abort(): void
}

/**
 * create indexed context
 * 
 * @param database database name
 * @param indexedDB indexeddb factory
 * @returns context
 */
export function makeContext(database: string, indexedDB?: IDBFactory) {
    /**
     * global transaction
     */
    const current: { value?: IDBTransaction } = { value: undefined }

    /**
     * get database
     * 
     * @returns database
     */
    const makeDatabase = async () => {
        return await getDatabase(database, indexedDB)
    }

    /**
     * set global transaction
     * 
     * @param transaction transaction
     */
    const setTransaction = (transaction?: IDBTransaction) => {
        if (current.value) current.value.db.close()
        current.value = transaction
    }

    /**
     * create transaction
     * 
     * @param store store name
     * @param mode transaction mode
     * @param option transaction option
     * @returns transaction
     */
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
            } else {
                throw new Error("localIndexed.abort requires transaction or upgrade")
            }
        }
    } as LDBContext
}