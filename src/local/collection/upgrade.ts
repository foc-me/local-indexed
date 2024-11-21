import { LDBContext } from "../context"

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
export type LDBCollectionOption = {
    keyPath?: string | string[] | null
    autoIncrement?: boolean
    index?: Record<string, LDBIndexOption>
}

/**
 * check the transaction mode is versionchange
 * 
 * some apis only work in versionchange transaction
 * 
 * @param transaction transaction
 * @returns result
 */
export function checkVersionChange(transaction?: IDBTransaction): transaction is IDBTransaction {
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
 * pick up create index options from create object store options
 * 
 * @param options create object store options
 * @returns splited options
 */
function splitCollectionOption(options: LDBCollectionOption) {
    const { keyPath, autoIncrement, index } = options
    return [{ keyPath, autoIncrement }, index] as [IDBObjectStoreParameters, Record<string, LDBIndexOption>]
}

/**
 * params of objectStore.createIndex
 */
type LDBCreateIndexOptions = [string, (string | string[]), IDBIndexParameters?]

/**
 * turn create index options to the type of objectStore.createIndex params
 * 
 * @param options create index options
 * @returns result
 */
function formatIndexOption(options?: Record<string, LDBIndexOption>) {
    return Object.entries(options || {}).map(([key, option]) => {
        const { keyPath, unique, multiEntry } = option
        return [key, keyPath || key, { unique, multiEntry }] as LDBCreateIndexOptions
    })
}

export function create(store: string, context: LDBContext, options: LDBCollectionOption) {
    const { transaction } = context
    if (checkVersionChange(transaction)) {
        if (containsStore(transaction, store)) {
            throw new ReferenceError(`objectStore '${store}' already exists`)
        }
        const [storeParams, indexOptions] = splitCollectionOption(options)
        const objectStore = transaction.db.createObjectStore(store, storeParams)
        const indexParams = formatIndexOption(indexOptions)
        for (let i = 0; i < indexParams.length; i++) {
            const [name, keyPath, option] = indexParams[i]
            objectStore.createIndex(name, keyPath, option)
        }
        return containsStore(transaction, store)
    }
    throw new Error("collection.create requires upgrade")
}

export function drop(store: string, context: LDBContext) {
    const { transaction } = context
    if (checkVersionChange(transaction)) {
        transaction.db.deleteObjectStore(store)
        return !containsStore(transaction, store)
    }
    throw new Error("collection.drop requires upgrade")
}

export function alter(store: string, context: LDBContext, options: LDBCollectionOption) {
    const { transaction } = context
    if (checkVersionChange(transaction)) {
        if (containsStore(transaction, store)) drop(store, context)
        return create(store, context, options)
    }
    throw new Error("collection.alter requires upgrade")
}

/**
 * check index exists or not in the object store
 * 
 * @param objectStore objectStore
 * @param index index name
 * @returns result
 */
function containsIndex(objectStore: IDBObjectStore, index: string) {
    return objectStore.indexNames.contains(index)
}

export function createIndex(store: string, context: LDBContext, index: string, options: LDBIndexOption) {
    const { transaction } = context
    if (checkVersionChange(transaction)) {
        if (!containsStore(transaction, store)) {
            throw new ReferenceError(`objectStore '${store}' does not exist`)
        }
        const objectStore = transaction.objectStore(store)
        const { keyPath, unique, multiEntry } = options
        objectStore.createIndex(index, keyPath || index, { unique, multiEntry })
        return containsIndex(objectStore, index)
    }
    throw new Error("collection.createIndex requires upgrade")
}

export function dropIndex(store: string, context: LDBContext, index: string) {
    const { transaction } = context
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