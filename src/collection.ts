import { type IDBActionRequest, requestAction } from "./lib/request"
import { transactionAction } from "./lib/transaction"
import { type LDBContext } from "./context"
import { type LDBCursor, cursor } from "./cursor"
import {
    type LDBStoreOption,
    type LDBIndexOption,
    create,
    alter,
    drop,
    createIndex,
    dropIndex
} from "./store"

export interface LDBCollection<T> {
    // upgrade
    create(option?: LDBStoreOption): boolean
    drop(): boolean
    alter(option?: LDBStoreOption): boolean
    createIndex(name: string, option?: LDBIndexOption): boolean
    dropIndex(name: string): boolean
    // action
    insert<K extends IDBValidKey>(values: any[]): Promise<K[]>
    insert<K extends IDBValidKey>(value: any): Promise<K>
    update<K extends IDBValidKey>(values: any[]): Promise<K[]>
    update<K extends IDBValidKey>(value: any): Promise<K>
    remove(key: IDBValidKey): Promise<void>
    remove(keys: IDBValidKey[]): Promise<void>
    remove(keyRnage: IDBKeyRange): Promise<void>
    find(keys: IDBValidKey[]): Promise<T[]>
    find(key?: IDBValidKey | IDBKeyRange, count?: number): Promise<T[]>
    //cursor
    find(filter: (item: T) => boolean, option?: { sort: string, order: string }): LDBCursor<T>
}

async function insert<K extends IDBValidKey>(objectStore: IDBObjectStore, values: any | any[]) {
    values = Array.isArray(values) ? values : [values]
    const result: K[] = []
    for (let i = 0; i < values.length; i++) {
        result.push(await requestAction(() => {
            objectStore.add(values[i])
        }))
    }
    return { result } as IDBActionRequest<K[]>
}

async function update<K extends IDBValidKey>(objectStore: IDBObjectStore, values: any | any[]) {
    values = Array.isArray(values) ? values : [values]
    const result: K[] = []
    for (let i = 0; i < values.length; i++) {
        result.push(await requestAction(() => {
            objectStore.put(values[i])
        }))
    }
    return { result } as IDBActionRequest<K[]>
}

async function remove(
    objectStore: IDBObjectStore,
    keys: IDBValidKey | IDBValidKey[] | IDBKeyRange
) {
    if (Array.isArray(keys)) {
        for (let i = 0; i < keys.length; i++) {
            await requestAction(() => {
                return objectStore.delete(keys[i])
            })
        }
        return undefined as IDBActionRequest<undefined>
    }
    return objectStore.delete(keys)
}

async function find<T>(
    objectStore: IDBObjectStore,
    keys: IDBValidKey | IDBValidKey[] | IDBKeyRange,
    count?: number
) {
    if (Array.isArray(keys)) {
        const result: T[] = []
        for (let i = 0; i < keys.length; i++) {
            result.push(await requestAction(() => {
                return objectStore.get(keys[i])
            }))
        }
        return { result } as IDBActionRequest<T[]>
    }
    return objectStore.getAll(keys)
}

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
        create: (option?: LDBStoreOption) => create(store, context, option),
        drop: () => drop(store, context),
        alter: (option?: LDBStoreOption) => alter(store, context, option),
        createIndex: (name, option) => createIndex(store, context, name, option),
        dropIndex: (name) => dropIndex(store, context, name),
        insert: (values: any | any[]) => {
            return makeTransactionAction("readwrite", (objectStore) => {
                return insert(objectStore, values)
            })
        },
        update: (values: any | any[]) => {
            return makeTransactionAction("readwrite", (objectStore) => {
                return update(objectStore, values)
            })
        },
        remove: (keys: IDBValidKey | IDBValidKey[] | IDBKeyRange) => {
            return makeTransactionAction("readwrite", (objectStore) => {
                return remove(objectStore, keys)
            })
        },
        find: (
            keys: IDBValidKey | IDBValidKey[] | IDBKeyRange | ((item: T) => boolean),
            option?: number | { sort: string, order: IDBCursorDirection }
        ) => {
            if (typeof keys === "function") {
                const { sort, order } = option as { sort: string, order: IDBCursorDirection } || {}
                return cursor(store, context, keys, { index: sort, direction: order })
            }
            return makeTransactionAction("readonly", (objectStore) => {
                return find(objectStore, keys, option as number)
            })
        }
    } as LDBCollection<T>
}