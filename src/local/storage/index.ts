import { type IDBActionRequest } from "../../lib/request"
import { transactionAction } from "../../lib/transaction"
import { type LDBContext } from "../context"
import { type LDBIndexStorage, indexStrage } from "./indexStorage"

/**
 * storage for database object store
 */
export interface LDBStorage<T extends object> {
    /**
     * set value to the store
     * 
     * @param value stored value
     * @param key key path value
     */
    setItem<K extends IDBValidKey>(value: any, key?: K): Promise<K>
    /**
     * get value from the store
     * 
     * @param query key path value of the store
     */
    getItem(query: IDBValidKey | IDBKeyRange): Promise<T | undefined>
    /**
     * remove value from the store
     * 
     * @param query key path value or key range
     */
    removeItem(query: IDBValidKey | IDBKeyRange): Promise<void>
    /**
     * count values from the store
     */
    length(query?: IDBValidKey | IDBKeyRange): Promise<number>
    /**
     * clear the store
     * 
     * @returns promise void
     */
    clear(): Promise<void>
    /**
     * get all keys
     */
    keys<K extends IDBValidKey>(query?: IDBValidKey | IDBKeyRange | null, count?: number): Promise<K[]>
    /**
     * get all values
     */
    values(query?: IDBValidKey | IDBKeyRange | null, count?: number): Promise<T[]>
    index(index: string): LDBIndexStorage<T>
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
        setItem: (value, key) => {
            return makeTransactionAction("readwrite", (objectStore) => {
                return objectStore.put(value, key)
            })
        },
        getItem: (query) => {
            return makeTransactionAction("readonly", (objectStore) => {
                return objectStore.get(query)
            })
        },
        removeItem: (query) => {
            return makeTransactionAction("readwrite", (objectStore) => {
                return objectStore.delete(query)
            })
        },
        length: (query) => {
            return makeTransactionAction("readonly", (objectStore) => {
                return objectStore.count(query)
            })
        },
        clear: () => {
            return makeTransactionAction("readwrite", (objectStore) => {
                return objectStore.clear()
            })
        },
        keys: (query, count) => {
            return makeTransactionAction("readonly", (objectStore) => {
                return objectStore.getAllKeys(query, count)
            })
        },
        values: (query, count) => {
            return makeTransactionAction("readonly", (objectStore) => {
                return objectStore.getAll(query, count)
            })
        },
        index: (index: string) => {
            return indexStrage(context, store, index)
        }
    } as LDBStorage<T>
}