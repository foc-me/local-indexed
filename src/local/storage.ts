import { getDatabase } from "../lib/database"
import { transactionAction } from "../lib/transaction"
import { type LDBContext } from "./context"

/**
 * storage for database object store
 */
export interface LDBStorage<T extends object> {
    /**
     * set value to the store
     * 
     * @param value stored value
     */
    setItem<K extends IDBValidKey>(value: any, keyValue?: K): Promise<K>
    /**
     * get value from the store
     * 
     * @param keyValue key path value of the store
     */
    getItem(keyValue: IDBValidKey): Promise<T | undefined>
    /**
     * remove value from the store
     * 
     * @param keyValue key path value of the store
     */
    removeItem(keyValue: IDBValidKey): Promise<void>
    /**
     * count values from the store
     */
    length(): Promise<number>
    /**
     * clear the store
     * 
     * @returns promise void
     */
    clear(): Promise<void>
    keys<K extends IDBValidKey>(): Promise<K[]>
    values(): Promise<T[]>
}

export function storage<T extends object>(store: string, context: LDBContext) {

    const getTransaction = async (mode?: IDBTransactionMode, options?: IDBTransactionOptions) => {
        const { database, indexedDB } = context
        const db = await getDatabase(database, indexedDB)
        return db.transaction(store, mode, options)
    }

    const setItem = async <K extends IDBValidKey>(value: any, keyValue?: K) => {
        const transaction = await getTransaction("readwrite")
        return await transactionAction<K>(transaction, () => {
            const objectStore = transaction.objectStore(store)
            return objectStore.put(value, keyValue)
        })
    }

    const getItem = async (keyValue: IDBValidKey) => {
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

    const keys = async <K extends IDBValidKey>() => {
        const transaction = await getTransaction("readonly")
        return await transactionAction<K[]>(transaction, () => {
            const objectStore = transaction.objectStore(store)
            return objectStore.getAllKeys()
        })
    }

    const values = async () => {
        const transaction = await getTransaction("readonly")
        return await transactionAction<T[]>(transaction, () => {
            const objectStore = transaction.objectStore(store)
            return objectStore.getAll()
        })
    }

    return {
        setItem,
        getItem,
        removeItem,
        length,
        clear,
        keys,
        values
    } as LDBStorage<T>
}