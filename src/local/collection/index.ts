import { transactionAction } from "../../lib/transaction"
import { requestAction, type IDBRequestActionResult } from "../../lib/request"
import { LDBContext } from "../context"
import {
    type LDBIndexOption,
    type LDBCollectionOption,
    create,
    drop,
    alter,
    createIndex,
    dropIndex
} from "./upgrade"
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

/**
 * collection of indexeddb database
 */
export interface LDBCollection<T extends object> {
    // upgrade api
    /**
     * create current object store
     * 
     * throw error if current object store exists
     * 
     * only use in upgrade callback
     * 
     * @param options create object store options
     */
    create(options: LDBCollectionOption): boolean
    /**
     * delete current object store
     * 
     * only use in upgrade callback
     */
    drop(): boolean
    /**
     * create current object store
     * 
     * delete current object store if exists
     * 
     * only use in upgrade callback
     * 
     * @param options create object store options
     */
    alter(options: LDBCollectionOption): boolean
    /**
     * create object store index
     * 
     * only use in upgrade callback
     * 
     * @param index index name
     * @param options create store index options
     */
    createIndex(index: string, options: LDBIndexOption): boolean
    /**
     * delete object store index
     * 
     * only use in upgrade callback
     * 
     * @param index index name
     */
    dropIndex(index: string): boolean
    // action api
    /**
     * add a value to current object store
     * 
     * throw error if the key value exists
     * 
     * @param value insert value
     */
    insertOne<K extends IDBValidKey>(value: any): Promise<K>
    /**
     * add values to current object store
     * 
     * @param value insert value
     */
    insertMany<K extends IDBValidKey>(value: any[]): Promise<K[]>
    update<K extends IDBValidKey>(value: any): Promise<K>
    updateOne<K extends IDBValidKey>(
        filter: (item: T) => T | void,
        option?: {
            query?: IDBValidKey | IDBKeyRange,
            direction?: IDBCursorDirection
        }
    ): Promise<K | undefined>
    updateMany<K extends IDBValidKey>(
        filter: (item: T) => T | void,
        option?: {
            query?: IDBValidKey | IDBKeyRange,
            direction?: IDBCursorDirection
        }
    ): Promise<K[]>
    remove(value: IDBValidKey): Promise<void>
    removeOne(
        filter: (item: T) => boolean,
        option?: {
            query?: IDBValidKey | IDBKeyRange,
            direction?: IDBCursorDirection
        }
    ): Promise<number>
    removeMany(
        filter: (item: T) => boolean,
        option?: {
            query?: IDBValidKey | IDBKeyRange,
            direction?: IDBCursorDirection
        }
    ): Promise<number>
    /**
     * get all index infos of current object store
     */
    getIndexes(): Promise<IDBIndexInfo[]>
    /**
     * find values of current object store
     */
    find(value: IDBValidKey): Promise<T | undefined>
    find(value: IDBKeyRange): Promise<T[]>
    find(filter?: (item: T) => boolean): Promise<T[]>
    /**
     * find the first value of current object store that matches the filter result
     * 
     * @param filter filter callback
     * @param query key value or key range
     * @param direction cursor direction
     */
    findOne(
        filter: (item: T) => boolean,
        option?: {
            query?: IDBValidKey | IDBKeyRange,
            direction?: IDBCursorDirection
        }
    ): Promise<T | undefined>
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
    const takeStoreAction = async <T>(
        mode: IDBTransactionMode,
        callback: (objectStore: IDBObjectStore) => IDBRequestActionResult | Promise<IDBRequestActionResult>
    ) => {
        const { transaction, getTransaction } = context
        if (transaction) {
            const objectStore = transaction.objectStore(store)
            return await requestAction<T>(() => {
                return callback(objectStore)
            })
        } else {
            const transaction = await getTransaction(store, mode)
            return await transactionAction<T>(transaction, () => {
                const objectStore = transaction.objectStore(store)
                return callback(objectStore)
            })
        }
    }

    return {
        //
        create: (options) => {
            return create(store, context, options)
        },
        drop: () => {
            return drop(store, context)
        },
        alter: (options) => {
            return alter(store, context, options)
        },
        createIndex: (index, options) => {
            return createIndex(store, context, index, options)
        },
        dropIndex: (index) => {
            return dropIndex(store, context, index)
        },
        //
        insertOne: async (value) => {
            return await takeStoreAction("readwrite", (objectStore) => {
                return insertOne(objectStore, value)
            })
        },
        insertMany: async (value) => {
            return await takeStoreAction("readwrite", (objectStore) => {
                return insertMany(objectStore, value)
            })
        },
        update: async (value) => {
            return await takeStoreAction("readwrite", (objectStore) => {
                return update(objectStore, value)
            })
        },
        updateOne: async (filter, option) => {
            return await takeStoreAction("readwrite", (objectStore) => {
                return updateOne(objectStore, filter, option)
            })
        },
        updateMany: async (filter, option) => {
            return await takeStoreAction("readwrite", (objectStore) => {
                return updateMany(objectStore, filter, option)
            })
        },
        remove: async (value) => {
            return await takeStoreAction("readwrite", (objectStore) => {
                return remove(objectStore, value)
            })
        },
        removeOne: async (filter, option) => {
            return await takeStoreAction("readwrite", (objectStore) => {
                return removeOne(objectStore, filter, option)
            })
        },
        removeMany: async (filter, option) => {
            return await takeStoreAction("readwrite", (objectStore) => {
                return removeMany(objectStore, filter, option)
            })
        },
        getIndexes: async () => {
            return await takeStoreAction("readonly", (objectStore) => {
                return getIndexes(objectStore)
            })
        },
        find: async (filter) => {
            return await takeStoreAction("readonly", (objectStore) => {
                return find<T>(objectStore, filter)
            })
        },
        findOne: async (filter, options) => {
            return await takeStoreAction("readonly", (objectStore) => {
                return findOne<T>(objectStore, filter, options)
            })
        },
        findMany: async (filter, options) => {
            return await takeStoreAction("readonly", (objectStore) => {
                return findMany<T>(objectStore, filter, options)
            })
        }
    } as LDBCollection<T>
}