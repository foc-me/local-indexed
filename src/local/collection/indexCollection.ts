import { type IDBActionRequest, requestAction } from "../../lib/request"
import { transactionAction } from "../../lib/transaction"
import { LDBContext } from "../context"
import { updateOneCursor, updateManyCursor } from "./update"
import { removeOneCursor, removeManyCursor } from "./remove"
import { findOne, findOneCursor, findManyKeyRange, findManyCursor } from "./find"
import { countMany, countManyCursor } from "./count"

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
     * get value with cursor
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
     * get value
     * 
     * @param value key value
     */
    findOne(value: IDBValidKey): Promise<T | undefined>
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
     * get values
     * 
     * @param value key range
     */
    findMany(range?: IDBValidKey | IDBKeyRange): Promise<T[]>
    /**
     * count values with cursor
     * 
     * @param filter cursor filter
     * @param option cursor option
     */
    count(
        filter: (item: T) => boolean,
        option?: {
            query?: IDBValidKey | IDBKeyRange,
            direction?: IDBCursorDirection,
            curosr?: boolean
        }
    ): Promise<number>
    /**
     * count values
     * 
     * @param value key value or key range
     */
    count(value?: IDBValidKey | IDBKeyRange): Promise<number>
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
                return updateOneCursor(storeIndex, filter, option)
            })
        },
        updateMany: (filter, option) => {
            return makeTransactionAction("readwrite", (storeIndex) => {
                return updateManyCursor(storeIndex, filter, option)
            })
        },
        removeOne: (filter, option) => {
            return makeTransactionAction("readwrite", (storeIndex) => {
                return removeOneCursor(storeIndex, filter, option)
            })
        },
        removeMany: (filter, option) => {
            return makeTransactionAction("readwrite", (storeIndex) => {
                return removeManyCursor(storeIndex, filter, option)
            })
        },
        findOne: (filter: ((item: T) => any) | IDBValidKey, option) => {
            return makeTransactionAction("readonly", (objectStore) => {
                if (typeof filter !== "function") return findOne(objectStore, filter)
                return findOneCursor(objectStore, filter, option)
            })
        },
        findMany: (filter: ((item: T) => any) | IDBValidKey | IDBKeyRange | undefined, option) => {
            return makeTransactionAction("readonly", (objectStore) => {
                if (typeof filter !== "function") return findManyKeyRange(objectStore, filter)
                return findManyCursor(objectStore, filter, option)
            })
        },
        count: (filter: ((item: T) => any) | IDBValidKey | IDBKeyRange | undefined, option) => {
            return makeTransactionAction("readonly", (objectStore) => {
                if (typeof filter !== "function") return countMany(objectStore, filter)
                return countManyCursor(objectStore, filter, option)
            })
        }
    } as LDBIndexCollection<T>
}