import { type IDBActionRequest, requestAction } from "../../lib/request"
import { transactionAction } from "../../lib/transaction"
import { type LDBContext } from "../context"
import { type IDBIndexInfo, getIndexes } from "./indexes"
import { insertOne, insertMany } from "./insert"
import { updateOne, updateOneCursor, updateMany, updateManyCursor } from "./update"
import { removeOne, removeOneCursor, removeManyKeyRange, removeManyCursor } from "./remove"
import { findOne, findOneCursor, findManyKeyRange, findManyCursor } from "./find"
import { countMany, countManyCursor } from "./count"
import {
    type LDBIndexOption,
    type LDBCollectionOption,
    create,
    drop,
    alter,
    createIndex,
    dropIndex
} from "./upgrade"
import { type LDBIndexCollection, indexCollection } from "./indexCollection"

/**
 * collection of indexeddb database
 */
export interface LDBCollection<T extends object> {
    // upgrade api
    /**
     * create store
     * 
     * only use in upgrade callback
     * 
     * @param option create store option
     */
    create(option: LDBCollectionOption): boolean
    /**
     * delete store
     * 
     * only use in upgrade callback
     */
    drop(): boolean
    /**
     * recreate store
     * 
     * only use in upgrade callback
     * 
     * @param option create object store option
     */
    alter(option: LDBCollectionOption): boolean
    /**
     * create store index
     * 
     * only use in upgrade callback
     * 
     * @param index index name
     * @param option create store index option
     */
    createIndex(index: string, option?: LDBIndexOption): boolean
    /**
     * delete store index
     * 
     * only use in upgrade callback
     * 
     * @param index index name
     */
    dropIndex(index: string): boolean
    // action api
    /**
     * insert value
     * 
     * @param value value
     */
    insertOne<K extends IDBValidKey>(value: any): Promise<K>
    /**
     * insert values
     * 
     * @param values valeus
     */
    insertMany<K extends IDBValidKey>(value: any[]): Promise<K[]>
    /**
     * update value with cursor
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
     * update value
     * 
     * @param value value
     */
    updateOne<K extends IDBValidKey>(value: any): Promise<K | undefined>
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
     * update values
     * 
     * @param values values
     */
    updateMany<K extends IDBValidKey>(values: any[]): Promise<K[]>
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
     * delete value
     * 
     * @param value key value
     */
    removeOne(value: IDBValidKey): Promise<number>
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
     * delete values
     * 
     * @param range key range
     */
    removeMany(range: IDBKeyRange): Promise<undefined>
    /**
     * get index detials in specified object store
     */
    getIndexes(): Promise<IDBIndexInfo[]>
    /**
     * get index collection
     * 
     * @param name index name
     */
    index(name: string): LDBIndexCollection<T>
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
    findOne(value: IDBValidKey): Promise<T[]>
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
 * create collection
 * 
 * @param context indexed context
 * @param store store name
 * @returns collection
 */
export function collection<T extends object>(context: LDBContext, store: string) {
    /**
     * get current objectStore from context
     * 
     * @param mode transaction mode
     * @param callback transaction action
     * @returns request
     */
    const makeTransactionAction = async <T>(
        mode: IDBTransactionMode,
        callback: (objectStore: IDBObjectStore) => IDBActionRequest | Promise<IDBActionRequest>
    ) => {
        const { getTransaction, makeTransaction } = context
        const current = getTransaction()
        if (current) {
            const objectStore = current.objectStore(store)
            return requestAction<T>(() => {
                return callback(objectStore)
            })
        }
        const transaction = await makeTransaction(store, mode)
        return transactionAction<T>(transaction, () => {
            const objectStore = transaction.objectStore(store)
            return callback(objectStore)
        }).finally(() => {
            context.setTransaction()
        })
    }

    return {
        //
        create: (option) => {
            return create(store, context, option)
        },
        drop: () => {
            return drop(store, context)
        },
        alter: (option) => {
            return alter(store, context, option)
        },
        createIndex: (index, option) => {
            return createIndex(store, context, index, option)
        },
        dropIndex: (index) => {
            return dropIndex(store, context, index)
        },
        //
        insertOne: (value) => {
            return makeTransactionAction("readwrite", (objectStore) => {
                return insertOne(objectStore, value)
            })
        },
        insertMany: (value) => {
            return makeTransactionAction("readwrite", (objectStore) => {
                return insertMany(objectStore, value)
            })
        },
        updateOne: (filter: ((item: T) => any) | any, option) => {
            return makeTransactionAction("readwrite", (objectStore) => {
                if (typeof filter !== "function") return updateOne(objectStore, filter)
                return updateOneCursor(objectStore, filter, option)
            })
        },
        updateMany: (filter: ((item: T) => any) | any[], option) => {
            return makeTransactionAction("readwrite", (objectStore) => {
                if (typeof filter !== "function") return updateMany(objectStore, filter)
                return updateManyCursor(objectStore, filter, option)
            })
        },
        removeOne: (filter: ((item: T) => any) | IDBValidKey, option) => {
            return makeTransactionAction("readwrite", (objectStore) => {
                if (typeof filter !== "function") return removeOne(objectStore, filter)
                return removeOneCursor(objectStore, filter, option)
            })
        },
        removeMany: (filter: ((item: T) => any) | IDBKeyRange, option) => {
            return makeTransactionAction("readwrite", (objectStore) => {
                if (typeof filter !== "function") return removeManyKeyRange(objectStore, filter)
                return removeManyCursor(objectStore, filter, option)
            })
        },
        getIndexes: () => {
            return makeTransactionAction("readonly", (objectStore) => {
                return getIndexes(objectStore)
            })
        },
        index: (name) => {
            return indexCollection(context, store, name)
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
    } as LDBCollection<T>
}