import { type IDBActionRequest } from "../../lib/request"
import { transactionAction } from "../../lib/transaction"
import { LDBContext } from "../context"

/**
 * storage for database object store
 */
export interface LDBIndexStorage<T extends object> {
    /**
     * get value from the store index
     * 
     * @param keyValue key path value of the store index
     */
    getItem(query: IDBValidKey | IDBKeyRange): Promise<T | undefined>
    /**
     * count values from the store index
     */
    length(query?: IDBValidKey | IDBKeyRange): Promise<number>
    /**
     * get all keys
     */
    keys<K extends IDBValidKey>(query?: IDBValidKey | IDBKeyRange | null, count?: number): Promise<K[]>
    /**
     * get all values
     */
    values(query?: IDBValidKey | IDBKeyRange | null, count?: number): Promise<T[]>
}

/**
 * get index storage
 * 
 * @param context database context
 * @param store store name
 * @param index index name
 * @returns index storeage
 */
export function indexStrage<T extends object>(context: LDBContext, store: string, index: string) {
    /**
     * make transaction action
     * 
     * @param index index name
     * @param mode transaction mode
     * @param callback action callback
     * @param option transaction option
     * @returns action
     */
    const makeTransactionAction = async <K>(
        index: string,
        mode: IDBTransactionMode,
        callback: (objectStore: IDBIndex) => IDBActionRequest | Promise<IDBActionRequest>,
        option?: IDBTransactionOptions
    ) => {
        const transaction = await context.makeTransaction(store, mode, option)
        return transactionAction<K>(transaction, () => {
            const objectStore = transaction.objectStore(store)
            const storeIndex = objectStore.index(index)
            return callback(storeIndex)
        }).finally(() => {
            context.setTransaction()
        })
    }

    return {
        getItem: (query) => {
            return makeTransactionAction(index, "readwrite", (storeIndex) => {
                return storeIndex.get(query)
            })
        },
        length: (query) => {
            return makeTransactionAction(index, "readonly", (storeIndex) => {
                return storeIndex.count(query)
            })
        },
        keys: (query, count) => {
            return makeTransactionAction(index, "readonly", (storeIndex) => {
                return storeIndex.getAllKeys(query, count)
            })
        },
        values: (query, count) => {
            return makeTransactionAction(index, "readonly", (storeIndex) => {
                return storeIndex.getAll(query, count)
            })
        }
    } as LDBIndexStorage<T>
}