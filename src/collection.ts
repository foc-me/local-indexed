import { type IDBActionRequest, requestAction } from "./lib/request"
import { transactionAction } from "./lib/transaction"
import { stores } from "./store/stores"
import { insertOne, insertMany } from "./store/insert"
import { updateOne, updateMany } from "./store/update"
import { remove } from "./store/remove"
import { find } from "./store/find"
import {
    type LDBStoreInfo,
    type LDBStoreOption,
    type LDBIndexOption,
    info,
    create,
    alter,
    drop,
    createIndex,
    dropIndex
} from "./store"
import { type LDBContext } from "./context"
import { type LDBCursor, cursor } from "./cursor"

/**
 * collection cursor option
 */
export type LDBCollectionCursor = {
    /**
     * 
     * @param item value
     * @returns match
     */
    filter?: (item: any) => boolean
    /**
     * sort by
     */
    sort?: string
    /**
     * order by
     */
    order?: IDBCursorDirection
}

/**
 * cursor directions
 */
const directions = ["next", "nextunique", "prev", "prevunique"]

/**
 * determine target is collection cursor option
 * 
 * @param target target
 * @returns target is collection cursor option
 */
function isCollectionCursor(target: any): target is LDBCollectionCursor {
    return Object.prototype.toString.call(target) === "[object Object]" && (
        typeof target.filter === "function" ||
        typeof target.sort === "string" ||
        directions.includes(target.order)
    )
}

/**
 * collection
 */
export interface LDBCollection<T> {
    //
    /**
     * get store info
     */
    info(): Promise<LDBStoreInfo>
    /**
     * detemine store exists
     */
    exists(): Promise<boolean>
    // upgrade
    /**
     * create store
     * 
     * @param option create store option
     */
    create(option?: LDBStoreOption): boolean
    /**
     * delete collection store
     */
    drop(): boolean
    /**
     * recreate store
     * 
     * @param option create store option
     */
    alter(option?: LDBStoreOption): boolean
    /**
     * create store index
     * 
     * @param name index name
     * @param option create store index option
     */
    createIndex(name: string, option?: LDBIndexOption): boolean
    /**
     * delete store index
     * 
     * @param name index name
     */
    dropIndex(name: string): boolean
    // action
    /**
     * insert values
     * 
     * @param values values
     */
    insert<K extends IDBValidKey>(values: any[]): Promise<K[]>
    /**
     * insert value
     * 
     * @param value value
     */
    insert<K extends IDBValidKey>(value: any): Promise<K>
    /**
     * update values
     * 
     * @param values values
     */
    update<K extends IDBValidKey>(values: any[]): Promise<K[]>
    /**
     * update value
     * 
     * @param value value
     */
    update<K extends IDBValidKey>(value: any): Promise<K>
    /**
     * delete value by key path
     * @param key key path value
     */
    remove(key: IDBValidKey): Promise<void>
    /**
     * delete values by key path
     * 
     * @param keys key path values
     */
    remove(keys: IDBValidKey[]): Promise<void>
    /**
     * delete values by key range
     * @param KeyRange key range
     */
    remove(KeyRange: IDBKeyRange): Promise<void>
    /**
     * get all values
     */
    find(): Promise<T[]>
    /**
     * get values
     * 
     * @param keys key path values
     */
    find(keys: IDBValidKey[]): Promise<T[]>
    /**
     * get values
     * 
     * @param key key path value or key range
     * @param count quantity limit
     */
    find(key: IDBValidKey | IDBKeyRange, count?: number): Promise<T[]>
    //cursor
    /**
     * get cursor
     * 
     * @param filter cursor filter
     */
    find(filter: (item: T) => boolean): LDBCursor<T>
    /**
     * get cursor
     * 
     * @param option cursor option
     */
    find(option: LDBCollectionCursor): LDBCursor<T>
}

/**
 * get collection
 * 
 * @param context indexed context
 * @param store store name
 * @returns collection
 */
export function collection<T>(context: LDBContext, store: string) {
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
        info: () => {
            return makeTransactionAction("readwrite", (objectStore) => {
                return info(objectStore)
            })
        },
        exists: async () => {
            const { database, indexedDB } = context
            const current = await stores(database, indexedDB)
            return current.includes(store)
        },
        create: (option?: LDBStoreOption) => create(store, context, option),
        drop: () => drop(store, context),
        alter: (option?: LDBStoreOption) => alter(store, context, option),
        createIndex: (name, option) => createIndex(store, context, name, option),
        dropIndex: (name) => dropIndex(store, context, name),
        insert: (values: any | any[]) => {
            return makeTransactionAction("readwrite", (objectStore) => {
                if (Array.isArray(values)) return insertMany(objectStore, values)
                else return insertOne(objectStore, values)
            })
        },
        update: (values: any | any[]) => {
            return makeTransactionAction("readwrite", (objectStore) => {
                if (Array.isArray(values)) return updateMany(objectStore, values)
                else return updateOne(objectStore, values)
            })
        },
        remove: (keys: IDBValidKey | IDBValidKey[] | IDBKeyRange) => {
            return makeTransactionAction("readwrite", (objectStore) => {
                return remove(objectStore, keys)
            })
        },
        find: (
            keys?: IDBValidKey | IDBValidKey[] | IDBKeyRange | ((item: T) => boolean) | LDBCollectionCursor,
            count?: number
        ) => {
            // return cursor
            if (typeof keys === "function") {
                return cursor(store, context, { filter: keys })
            }
            // return cursor
            if (isCollectionCursor(keys)) {
                const { filter = () => true, sort, order } = keys
                return cursor(store, context, { filter, index: sort, direction: order })
            }
            // return promise values
            return makeTransactionAction("readonly", (objectStore) => {
                return find(objectStore, keys, count)
            })
        }
    } as LDBCollection<T>
}