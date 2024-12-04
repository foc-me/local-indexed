import { type IDBActionRequest, requestAction } from "../../lib/request"
import { transactionAction } from "../../lib/transaction"
import { LDBContext } from "../context"
import {
    updateOne,
    updateMany,
    removeOne,
    removeMany,
    find,
    findOne,
    findMany,
    count,
    countMany
} from "./action"

/**
 * index collection of collection
 */
export interface LDBIndexCollection<T extends object> {
    /**
     * update one value with cursor
     * 
     * close cursor after first value updated
     * 
     * @param filter cursor filter
     * @param option cursor option
     */
    updateOne<K extends IDBValidKey>(
        filter: (item: T) => any,
        option?: {
            query?: IDBValidKey | IDBKeyRange,
            direction?: IDBCursorDirection
        }
    ): Promise<K | undefined>
    /**
     * update values with cursor
     * 
     * @param filter cursor filter
     * @param option cursor option
     */
    updateMany<K extends IDBValidKey>(
        filter: (item: T) => any,
        option?: {
            query?: IDBValidKey | IDBKeyRange,
            direction?: IDBCursorDirection
        }
    ): Promise<K[]>
    /**
     * delete value with cursor
     * 
     * close cursor after first value deleted
     * 
     * @param filter cursor filter
     * @param option cursor option
     */
    removeOne(
        filter: (item: T) => boolean,
        option?: {
            query?: IDBValidKey | IDBKeyRange,
            direction?: IDBCursorDirection
        }
    ): Promise<number>
    /**
     * delete values with cursor
     * 
     * @param filter cursor filter
     * @param option cursor option
     */
    removeMany(
        filter: (item: T) => boolean,
        option?: {
            query?: IDBValidKey | IDBKeyRange,
            direction?: IDBCursorDirection
        }
    ): Promise<number>
    /**
     * get value by key
     * 
     * @param value key value
     */
    find(value: IDBValidKey): Promise<T | undefined>
    /**
     * find values by key range
     * 
     * @param value key range
     */
    find(range: IDBKeyRange): Promise<T[]>
    /**
     * find values by filter
     * 
     * @param filter value filter
     */
    find(filter?: (item: T) => boolean): Promise<T[]>
    /**
     * get value with cursor
     * 
     * close cursor after first value finded
     * 
     * @param filter cursor filter
     * @param option cursor option
     */
    findOne(
        filter: (item: T) => boolean,
        option?: {
            query?: IDBValidKey | IDBKeyRange,
            direction?: IDBCursorDirection
        }
    ): Promise<T | undefined>
    /**
     * get values with cursor
     * 
     * @param filter cursor filter
     * @param option cursor option
     */
    findMany(
        filter: (item: T) => boolean,
        option?: {
            query?: IDBValidKey | IDBKeyRange,
            direction?: IDBCursorDirection
        }
    ): Promise<T[]>
    /**
     * count value by key
     * 
     * @param value key value
     */
    count(value: IDBValidKey): Promise<number>
    /**
     * count values by key range
     * 
     * @param value key range
     */
    count(range: IDBKeyRange): Promise<number>
    /**
     * count values by filter
     * 
     * @param filter value filter
     */
    count(filter?: (item: T) => boolean): Promise<number>
    /**
     * count values with cursor
     * 
     * @param filter cursor filter
     * @param option cursor option
     */
    countMany(
        filter: (item: T) => boolean,
        option?: {
            query?: IDBValidKey | IDBKeyRange,
            direction?: IDBCursorDirection
        }
    ): Promise<number>
}

/**
 * create index collection
 * 
 * @param context indexed context
 * @param store store name
 * @param index index name
 * @returns collection
 */
export function indexCollection<T extends object>(context: LDBContext, store: string, index: string) {
    /**
     * get current objectStore from context
     * 
     * @param mode transaction mode
     * @param callback transaction action
     * @returns request
     */
    const makeTransactionAction = async <T>(
        mode: IDBTransactionMode,
        callback: (storeIndex: IDBIndex) => IDBActionRequest | Promise<IDBActionRequest>
    ) => {
        const { getTransaction, makeTransaction } = context
        const current = getTransaction()
        if (current) {
            const objectStore = current.objectStore(store)
            const storeIndex = objectStore.index(index)
            return requestAction<T>(() => {
                return callback(storeIndex)
            })
        }
        const transaction = await makeTransaction(store, mode)
        return transactionAction<T>(transaction, () => {
            const objectStore = transaction.objectStore(store)
            const storeIndex = objectStore.index(index)
            return callback(storeIndex)
        }).finally(() => {
            context.setTransaction()
        })
    }

    return {
        updateOne: (filter, option) => {
            return makeTransactionAction("readwrite", (storeIndex) => {
                return updateOne(storeIndex, filter, option)
            })
        },
        updateMany: (filter, option) => {
            return makeTransactionAction("readwrite", (storeIndex) => {
                return updateMany(storeIndex, filter, option)
            })
        },
        removeOne: (filter, option) => {
            return makeTransactionAction("readwrite", (storeIndex) => {
                return removeOne(storeIndex, filter, option)
            })
        },
        removeMany: (filter, option) => {
            return makeTransactionAction("readwrite", (storeIndex) => {
                return removeMany(storeIndex, filter, option)
            })
        },
        find: (filter) => {
            return makeTransactionAction("readonly", (storeIndex) => {
                return find(storeIndex, filter)
            })
        },
        findOne: (filter, option) => {
            return makeTransactionAction("readonly", (storeIndex) => {
                return findOne(storeIndex, filter, option)
            })
        },
        findMany: (filter, option) => {
            return makeTransactionAction("readonly", (storeIndex) => {
                return findMany(storeIndex, filter, option)
            })
        },
        count: (filter) => {
            return makeTransactionAction("readonly", (storeIndex) => {
                return count(storeIndex, filter)
            })
        },
        countMany: (filter, option) => {
            return makeTransactionAction("readonly", (storeIndex) => {
                return countMany(storeIndex, filter, option)
            })
        }
    } as LDBIndexCollection<T>
}