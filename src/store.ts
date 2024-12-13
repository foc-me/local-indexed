import { type IDBActionRequest } from "./lib/request"
import { LDBContext } from "./context"

/**
 * create index option
 */
export type LDBIndexOption = {
    keyPath?: string | Iterable<string>
    unique?: boolean
    multiEntry?: boolean
}

/**
 * create object store option
 */
export type LDBStoreOption = {
    keyPath?: string | string[] | null
    autoIncrement?: boolean
    indexes?: Record<string, LDBIndexOption>
}

/**
 * create index option
 */
export type LDBIndexInfo = {
    name: string
    keyPath: string | string[]
    unique: boolean
    multiEntry: boolean
}

/**
 * create object store option
 */
export type LDBStoreInfo = {
    name: string
    keyPath: string | string[] | null
    autoIncrement: boolean
    indexes: Record<string, LDBIndexInfo>
}

export function info(objectStore: IDBObjectStore) {
    const { name, keyPath, autoIncrement, indexNames } = objectStore
    const indexes: Record<string, LDBIndexInfo>[] = [...indexNames].map((name) => {
        const { keyPath, unique, multiEntry } = objectStore.index(name)
        return { [name]: { name, keyPath, unique, multiEntry } }
    })
    return {
        result: {
            name,
            keyPath,
            autoIncrement,
            indexes: Object.assign({}, ...indexes)
        }
    } as IDBActionRequest<LDBStoreInfo>
}

/**
 * check the transaction mode is versionchange
 * 
 * some apis only work in versionchange transaction
 * 
 * @param transaction transaction
 * @returns result
 */
function checkVersionChange(transaction?: IDBTransaction): transaction is IDBTransaction {
    return !!transaction && transaction.mode === "versionchange"
}

/**
 * check store exists or not in the transaction
 * 
 * @param transaction transaction
 * @param store store name
 * @returns resulr
 */
function containsStore(transaction: IDBTransaction, store: string) {
    return transaction.objectStoreNames.contains(store)
}

/**
 * pick up create index option from create object store option
 * 
 * @param option create object store option
 * @returns splited option
 */
function splitCollectionOption(option?: LDBStoreOption) {
    const { keyPath, autoIncrement, indexes } = option || {}
    return [{ keyPath, autoIncrement }, indexes] as [IDBObjectStoreParameters, Record<string, LDBIndexOption>]
}

/**
 * params of objectStore.createIndex
 */
type LDBCreateIndexOption = [string, (string | string[]), IDBIndexParameters?]

/**
 * turn create index option to the type of objectStore.createIndex params
 * 
 * @param option create index option
 * @returns result
 */
function formatIndexOption(option?: Record<string, LDBIndexOption>) {
    return Object.entries(option || {}).map(([key, value]) => {
        const { keyPath, unique, multiEntry } = value
        return [key, keyPath || key, { unique, multiEntry }] as LDBCreateIndexOption
    })
}

/**
 * create store
 * 
 * @param store store name
 * @param context database context
 * @param option create store option
 * @returns true if store exists
 */
export function create(store: string, context: LDBContext, option?: LDBStoreOption) {
    const transaction = context.getTransaction()
    if (checkVersionChange(transaction)) {
        if (containsStore(transaction, store)) {
            throw new ReferenceError(`objectStore '${store}' already exists`)
        }
        const [storeOption, indexOption] = splitCollectionOption(option)
        const objectStore = transaction.db.createObjectStore(store, storeOption)
        const indexParams = formatIndexOption(indexOption)
        for (let i = 0; i < indexParams.length; i++) {
            const [name, keyPath, option] = indexParams[i]
            objectStore.createIndex(name, keyPath, option)
        }
        return containsStore(transaction, store)
    }
    throw new Error("collection.create requires upgrade")
}

/**
 * delete store
 * 
 * @param store store name
 * @param context database context
 * @returns true if store not exists
 */
export function drop(store: string, context: LDBContext) {
    const transaction = context.getTransaction()
    if (checkVersionChange(transaction)) {
        transaction.db.deleteObjectStore(store)
        return !containsStore(transaction, store)
    }
    throw new Error("collection.drop requires upgrade")
}

/**
 * recreate store
 * 
 * @param store store name
 * @param context database context
 * @param option create store option
 * @returns true if store exists
 */
export function alter(store: string, context: LDBContext, option?: LDBStoreOption) {
    const transaction = context.getTransaction()
    if (checkVersionChange(transaction)) {
        if (containsStore(transaction, store)) drop(store, context)
        return create(store, context, option)
    }
    throw new Error("collection.alter requires upgrade")
}

/**
 * check index exists or not in the object store
 * 
 * @param objectStore objectStore
 * @param index index name
 * @returns true if index exists
 */
function containsIndex(objectStore: IDBObjectStore, index: string) {
    return objectStore.indexNames.contains(index)
}

/**
 * create store index
 * 
 * @param store store name
 * @param context database context
 * @param index index name
 * @param option create index option
 * @returns true if index exists
 */
export function createIndex(store: string, context: LDBContext, index: string, option?: LDBIndexOption) {
    const transaction = context.getTransaction()
    if (checkVersionChange(transaction)) {
        if (!containsStore(transaction, store)) {
            throw new ReferenceError(`objectStore '${store}' does not exist`)
        }
        const objectStore = transaction.objectStore(store)
        const { keyPath, unique, multiEntry } = option || {}
        objectStore.createIndex(index, keyPath || index, { unique, multiEntry })
        return containsIndex(objectStore, index)
    }
    throw new Error("collection.createIndex requires upgrade")
}

/**
 * delete store index
 * 
 * @param store store name
 * @param context database context
 * @param index index name
 * @returns true if index not exists
 */
export function dropIndex(store: string, context: LDBContext, index: string) {
    const transaction = context.getTransaction()
    if (checkVersionChange(transaction)) {
        if (!containsStore(transaction, store)) {
            throw new ReferenceError(`objectStore '${store}' does not exist`)
        }
        const objectStore = transaction.objectStore(store)
        objectStore.deleteIndex(index)
        return !containsIndex(objectStore, index)
    }
    throw new Error("collection.dropIndex requires upgrade")
}