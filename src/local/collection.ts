import { transactionAction } from "../lib/transaction"
import { requestAction, type IDBRequestActionResult } from "../lib/request"
import { cursorAction } from "../lib/cursor"
import { LDBContext } from "./context"

/**
 * create index option
 */
type LDBIndexOption = {
    keyPath?: string | Iterable<string>
    unique?: boolean
    multiEntry?: boolean
}

/**
 * create object store option
 */
type LDBCollectionOption = {
    keyPath?: string | string[] | null
    autoIncrement?: boolean
    index?: Record<string, LDBIndexOption>
}

/**
 * object store index detials
 */
type IDBIndexInfo = {
    name: string
    keyPath: string | string[]
    unique: boolean
    multiEntry: boolean
}

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
    removeOne<K extends IDBValidKey>(
        filter: (item: T) => boolean,
        option?: {
            query?: IDBValidKey | IDBKeyRange,
            direction?: IDBCursorDirection
        }
    ): Promise<K | undefined>
    removeMany<K extends IDBValidKey>(
        filter: (item: T) => boolean,
        option?: {
            query?: IDBValidKey | IDBKeyRange,
            direction?: IDBCursorDirection
        }
    ): Promise<K[]>
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
 * check index exists or not in the object store
 * 
 * @param objectStore objectStore
 * @param index index name
 * @returns result
 */
function containsIndex(objectStore: IDBObjectStore, index: string) {
    return objectStore.indexNames.contains(index)
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

/**
 * create collection
 * 
 * @param store store name
 * @param context indexed context
 * @returns collection
 */
export function collection<T extends object>(store: string, context: LDBContext) {
    const create = (options: LDBCollectionOption) => {
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

    const drop = () => {
        const { transaction } = context
        if (checkVersionChange(transaction)) {
            transaction.db.deleteObjectStore(store)
            return !containsStore(transaction, store)
        }
        throw new Error("collection.drop requires upgrade")
    }

    const alter = (options: LDBCollectionOption) => {
        const { transaction } = context
        if (checkVersionChange(transaction)) {
            if (containsStore(transaction, store)) drop()
            return create(options)
        }
        throw new Error("collection.alter requires upgrade")
    }

    const createIndex = (index: string, options: LDBIndexOption) => {
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

    const dropIndex = (index: string) => {
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

    /**
     * get current transaction from context
     * 
     * in different situations use different ways to get transaction
     * 
     * @param mode transaction mode
     * @param callback transaction action
     * @returns request
     */
    const takeRequestAction = async <T>(
        mode: IDBTransactionMode,
        callback: (transaction: IDBTransaction) => IDBRequestActionResult | Promise<IDBRequestActionResult>
    ) => {
        const { transaction, getTransaction } = context
        if (transaction) {
            return await requestAction<T>(async () => {
                const call = callback(transaction)
                return call instanceof Promise ? await call : call
            })
        } else {
            const transaction = await getTransaction(store, mode)
            return await transactionAction<T>(transaction, () => {
                return callback(transaction)
            })
        }
    }

    const insertOne = async <K extends IDBValidKey>(value: any) => {
        return await takeRequestAction<K>("readwrite", (transaction) => {
            const objectStore = transaction.objectStore(store)
            return objectStore.add(value)
        })
    }

    const insertMany = async <K extends IDBValidKey>(values: any[]) => {
        return await takeRequestAction<K[]>("readwrite", async (transaction) => {
            const objectStore = transaction.objectStore(store)
            const result: K[] = []
            for (let i = 0; i < values.length; i++) {
                result.push(await requestAction(() => objectStore.add(values[i])))
            }
            return { result }
        })
    }

    const update = async <K extends IDBValidKey>(value: any) => {
        return await takeRequestAction<K>("readwrite", (transaction) => {
            const objectStore = transaction.objectStore(store)
            return objectStore.put(value)
        })
    }

    const updateOne = async <K extends IDBValidKey>(
        filter: (item: T) => T | void,
        option?: {
            query?: IDBValidKey | IDBKeyRange,
            direction?: IDBCursorDirection
        }
    ) => {
        return await takeRequestAction<K>("readwrite", async (transaction) => {
            const objectStore = transaction.objectStore(store)
            const { query, direction } = option || {}
            const request = objectStore.openCursor(query, direction)
            const result = await cursorAction<K | undefined>(request, async (cursor) => {
                const target = filter(cursor.value)
                if (target) {
                    return await requestAction<K>(() => {
                        return cursor.update(target)
                    })
                }
                cursor.continue()
            })
            return { result }
        })
    }

    const updateMany = async <K extends IDBValidKey>(
        filter: (item: T) => T | void,
        option?: {
            query?: IDBValidKey | IDBKeyRange,
            direction?: IDBCursorDirection
        }
    ) => {
        return await takeRequestAction<K[]>("readwrite", async (transaction) => {
            const objectStore = transaction.objectStore(store)
            const { query, direction } = option || {}
            const request = objectStore.openCursor(query, direction)
            const result: K[] = []
            await cursorAction(request, async (cursor) => {
                const target = filter(cursor.value)
                if (target) {
                    result.push(await requestAction(() => {
                        return cursor.update(target)
                    }))
                }
                cursor.continue()
            })
            return { result }
        })
    }

    const remove = async (value: IDBValidKey | IDBKeyRange) => {
        await takeRequestAction("readwrite", (transaction) => {
            const objectStore = transaction.objectStore(store)
            return objectStore.delete(value)
        })
    }

    const removeOne = async <K extends IDBValidKey>(
        filter: (item: T) => boolean,
        option?: {
            query?: IDBValidKey | IDBKeyRange,
            direction?: IDBCursorDirection
        }
    ) => {
        return await takeRequestAction<K[]>("readwrite", async (transaction) => {
            const objectStore = transaction.objectStore(store)
            const { query, direction } = option || {}
            const request = objectStore.openCursor(query, direction)
            const result: K[] = []
            await cursorAction(request, async (cursor) => {
                if (filter(cursor.value) === true) {
                    result.push(await requestAction(() => {
                        return cursor.delete()
                    }))
                    return true
                }
                cursor.continue()
            })
            return { result }
        })
    }

    const removeMany = async <K extends IDBValidKey>(
        filter: (item: T) => boolean,
        option?: {
            query?: IDBValidKey | IDBKeyRange,
            direction?: IDBCursorDirection
        }
    ) => {
        return await takeRequestAction<K[]>("readwrite", async (transaction) => {
            const objectStore = transaction.objectStore(store)
            const { query, direction } = option || {}
            const request = objectStore.openCursor(query, direction)
            const result: K[] = []
            await cursorAction(request, async (cursor) => {
                if (filter(cursor.value) === true) {
                    result.push(await requestAction(() => {
                        return cursor.delete()
                    }))
                }
                cursor.continue()
            })
            return { result }
        })
    }

    const getIndexes = async () => {
        return await takeRequestAction<IDBIndexInfo[]>("readonly", (transaction) => {
            const objectStore = transaction.objectStore(store)
            const indexNames = [...objectStore.indexNames]
            const result: IDBIndexInfo[] = []
            for (let i = 0; i < indexNames.length; i++) {
                const { name, keyPath, unique, multiEntry } = objectStore.index(indexNames[i])
                result.push({ name, keyPath, unique, multiEntry })
            }
            return { result }
        })
    }

    const find = async (filter?: IDBValidKey | IDBKeyRange | ((item: T) => boolean)) => {
        if (filter === undefined || typeof filter === "function") {
            const results = await takeRequestAction<T[]>("readonly", (transaction) => {
                const objectStore = transaction.objectStore(store)
                return objectStore.getAll()
            })
            return filter ? results.filter(filter) : results
        }
        return await takeRequestAction<T | T[] | undefined>("readonly", (transaction) => {
            const objectStore = transaction.objectStore(store)
            return objectStore.get(filter)
        })
    }

    const findOne = async (
        filter: (item: T) => boolean,
        option?: {
            query?: IDBValidKey | IDBKeyRange,
            direction?: IDBCursorDirection
        }
    ) => {
        return await takeRequestAction<T | undefined>("readonly", async (transaction) => {
            const objectStore = transaction.objectStore(store)
            const { query, direction } = option || {}
            const request = objectStore.openCursor(query, direction)
            const result = await cursorAction<T | undefined>(request, (cursor) => {
                if (filter(cursor.value) === true) {
                    return cursor.value
                } else cursor.continue()
            })
            return { result }
        })
    }

    const findMany = async (
        filter: (item: T) => boolean,
        option?: {
            query?: IDBValidKey | IDBKeyRange,
            direction?: IDBCursorDirection
        }
    ) => {
        return await takeRequestAction<T[]>("readonly", async (transaction) => {
            const objectStore = transaction.objectStore(store)
            const { query, direction } = option || {}
            const request = objectStore.openCursor(query, direction)
            const result: T[] = []
            await cursorAction(request, (cursor) => {
                if (filter(cursor.value) === true) {
                    result.push(cursor.value)
                }
                cursor.continue()
            })
            return { result }
        })
    }

    return {
        //
        create,
        drop,
        alter,
        createIndex,
        dropIndex,
        //
        insertOne,
        insertMany,
        update,
        updateOne,
        updateMany,
        remove,
        removeOne,
        removeMany,
        //
        getIndexes,
        find,
        findOne,
        findMany
    } as LDBCollection<T>
}