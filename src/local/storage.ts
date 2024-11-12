import { getDatabase } from "../lib/database"
import { transactionAction } from "../lib/transaction"
import { type LDBContext } from "./context"

/**
 * storage for database object store
 */
export interface LDBStorage {
    /**
     * set value to the store
     * 
     * @param value stored value
     * @returns promise void
     */
    setItem: <T extends IDBValidKey>(value: any, keyValue?: T) => Promise<T>

    /**
     * get value from the store
     * 
     * @param keyValue key path value of the store
     * @returns promise value
     */
    getItem: <T extends object>(keyValue: IDBValidKey) => Promise<T | undefined>

    /**
     * remove value from the store
     * 
     * @param keyValue key path value of the store
     * @returns promise void
     */
    removeItem: (keyValue: IDBValidKey) => Promise<void>

    /**
     * count values from the store
     * 
     * @returns promise length
     */
    length: () => Promise<number>

    /**
     * clear the store
     * 
     * @returns promise void
     */
    clear: () => Promise<void>
}

export function storage(store: string, context: LDBContext) {

    const getTransaction = async (mode?: IDBTransactionMode, options?: IDBTransactionOptions) => {
        const { database, indexedDB } = context
        const db = await getDatabase(database, indexedDB)
        return db.transaction(store, mode, options)
    }

    const setItem = async <T extends IDBValidKey>(value: any, keyValue?: T) => {
        const transaction = await getTransaction("readwrite")
        return await transactionAction<T>(transaction, () => {
            const objectStore = transaction.objectStore(store)
            return objectStore.put(value, keyValue)
        })
    }

    const getItem = async <T extends object>(keyValue: IDBValidKey) => {
        const transaction = await getTransaction("readonly")
        return await transactionAction<T | undefined>(transaction, () => {
            const objectStore = transaction.objectStore(store)
            return objectStore.get(keyValue)
        })
    }

    const removeItem = async (keyValue: IDBValidKey) => {
        const transaction = await getTransaction("readwrite")
        return await transactionAction<void>(transaction, () => {
            const objectStore = transaction.objectStore(store)
            return objectStore.delete(keyValue)
        })
    }

    const length = async () => {
        const transaction = await getTransaction("readonly")
        return await transactionAction<number>(transaction, () => {
            const objectStore = transaction.objectStore(store)
            return objectStore.count()
        })
    }

    const clear = async () => {
        const transaction = await getTransaction("readwrite")
        return await transactionAction<void>(transaction, () => {
            const objectStore = transaction.objectStore(store)
            return objectStore.clear()
        })
    }

    return { setItem, getItem, removeItem, length, clear } as LDBStorage
}