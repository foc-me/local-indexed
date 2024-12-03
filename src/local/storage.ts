import { type IDBActionRequest } from "../lib/request"
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
    getItem(keyValue: IDBValidKey | IDBKeyRange): Promise<T | undefined>
    /**
     * remove value from the store
     * 
     * @param keyValue key path value of the store
     */
    removeItem(keyValue: IDBValidKey | IDBKeyRange): Promise<void>
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
    /**
     * get all keys
     */
    keys<K extends IDBValidKey>(): Promise<K[]>
    /**
     * get all values
     */
    values(): Promise<T[]>
}

/**
 * indexed storage
 * 
 * @param context database context
 * @param store store name
 * @returns storage
 */
export function storage<T extends object>(context: LDBContext, store: string) {
    /**
     * make transaction action
     * 
     * @param mode transaction mode
     * @param callback action callback
     * @param option transaction option
     * @returns action
     */
    const makeTransactionAction = async <K>(
        mode: IDBTransactionMode,
        callback: (objectStore: IDBObjectStore) => IDBActionRequest | Promise<IDBActionRequest>,
        option?: IDBTransactionOptions
    ) => {
        const transaction = await context.makeTransaction(store, mode, option)
        return transactionAction<K>(transaction, () => {
            const objectStore = transaction.objectStore(store)
            return callback(objectStore)
        }).finally(() => {
            context.setTransaction()
        })
    }

    return {
        setItem: (value, keyValue) => {
            return makeTransactionAction("readwrite", (objectStore) => {
                return objectStore.put(value, keyValue)
            })
        },
        getItem: (keyValue) => {
            return makeTransactionAction("readonly", (objectStore) => {
                return objectStore.get(keyValue)
            })
        },
        removeItem: (keyValue) => {
            return makeTransactionAction("readwrite", (objectStore) => {
                return objectStore.delete(keyValue)
            })
        },
        length: () => {
            return makeTransactionAction("readonly", (objectStore) => {
                return objectStore.count()
            })
        },
        clear: () => {
            return makeTransactionAction("readwrite", (objectStore) => {
                return objectStore.clear()
            })
        },
        keys: () => {
            return makeTransactionAction("readonly", (objectStore) => {
                return objectStore.getAllKeys()
            })
        },
        values: () => {
            return makeTransactionAction("readonly", (objectStore) => {
                return objectStore.getAll()
            })
        }
    } as LDBStorage<T>
}