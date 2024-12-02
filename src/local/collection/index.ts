import { type IDBActionRequest, requestAction } from "../../lib/request"
import { transactionAction } from "../../lib/transaction"
import { LDBContext } from "../context"
import {
    type IDBIndexInfo,
    insertOne,
    insertMany,
    update,
    updateOne,
    updateMany,
    remove,
    removeOne,
    removeMany,
    getIndexes,
    find,
    findOne,
    findMany
} from "./action"
import {
    type LDBIndexOption,
    type LDBCollectionOption,
    create,
    drop,
    alter,
    createIndex,
    dropIndex
} from "./upgrade"

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
    createIndex(index: string, option: LDBIndexOption): boolean
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
     * insert one value
     * 
     * @param value insert value
     */
    insertOne<K extends IDBValidKey>(value: any): Promise<K>
    /**
     * insert values
     * 
     * @param values insert valeus
     */
    insertMany<K extends IDBValidKey>(value: any[]): Promise<K[]>
    /**
     * update one value
     * 
     * @param value update value
     */
    update<K extends IDBValidKey>(value: any): Promise<K>
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
     * delete value by keys
     * 
     * @param value delete keys
     */
    remove(value: IDBValidKey): Promise<void>
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
     * get index detials in specified object store
     */
    getIndexes(): Promise<IDBIndexInfo[]>
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
    find(value: IDBKeyRange): Promise<T[]>
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
}

/**
 * create collection
 * 
 * @param store store name
 * @param context indexed context
 * @returns collection
 */
export function collection<T extends object>(store: string, context: LDBContext) {
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
        update: (value) => {
            return makeTransactionAction("readwrite", (objectStore) => {
                return update(objectStore, value)
            })
        },
        updateOne: (filter, option) => {
            return makeTransactionAction("readwrite", (objectStore) => {
                return updateOne(objectStore, filter, option)
            })
        },
        updateMany: (filter, option) => {
            return makeTransactionAction("readwrite", (objectStore) => {
                return updateMany(objectStore, filter, option)
            })
        },
        remove: (value) => {
            return makeTransactionAction("readwrite", (objectStore) => {
                return remove(objectStore, value)
            })
        },
        removeOne: (filter, option) => {
            return makeTransactionAction("readwrite", (objectStore) => {
                return removeOne(objectStore, filter, option)
            })
        },
        removeMany: (filter, option) => {
            return makeTransactionAction("readwrite", (objectStore) => {
                return removeMany(objectStore, filter, option)
            })
        },
        getIndexes: () => {
            return makeTransactionAction("readonly", (objectStore) => {
                return getIndexes(objectStore)
            })
        },
        find: (filter) => {
            return makeTransactionAction("readonly", (objectStore) => {
                return find<T>(objectStore, filter)
            })
        },
        findOne: (filter, option) => {
            return makeTransactionAction("readonly", (objectStore) => {
                return findOne<T>(objectStore, filter, option)
            })
        },
        findMany: (filter, option) => {
            return makeTransactionAction("readonly", (objectStore) => {
                return findMany<T>(objectStore, filter, option)
            })
        }
    } as LDBCollection<T>
}