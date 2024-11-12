import { transactionAction } from "../lib/transaction"
import { requestAction, type IDBRequestLike, IDBRequestActionResult } from "../lib/request"
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
     * @returns key value
     */
    insertOne: <K extends IDBValidKey>(value: any) => Promise<K>
    /**
     * add values to current object store
     * 
     * @param value insert value
     */
    insertMany(value: any[]): Promise<number>
    // select api
    /**
     * get all index infos of current object store
     */
    getIndexes(): Promise<IDBIndexInfo[]>
    /**
     * get all values of current object store
     */
    values(): Promise<T[]>
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
        throw new Error("only use this api in upgrade callback")
    }

    const drop = () => {
        const { transaction } = context
        if (checkVersionChange(transaction)) {
            transaction.db.deleteObjectStore(store)
            return !containsStore(transaction, store)
        }
        throw new Error("only use this api in upgrade callback")
    }

    const alter = (options: LDBCollectionOption) => {
        const { transaction } = context
        if (checkVersionChange(transaction)) {
            if (containsStore(transaction, store)) drop()
            return create(options)
        }
        throw new Error("only use this api in upgrade callback")
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
        throw new Error("only use this api in upgrade callback")
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
        throw new Error("only use this api in upgrade callback")
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
        return await takeRequestAction<K>("readwrite", (transaction: IDBTransaction) => {
            const objectStore = transaction.objectStore(store)
            return objectStore.add(value)
        })
    }

    const insertMany = async (values: any[]) => {
        return await takeRequestAction<number>("readwrite", async (transaction: IDBTransaction) => {
            const objectStore = transaction.objectStore(store)
            const ids = []
            for (let i = 0; i < values.length; i++) {
                ids.push(await requestAction(() => objectStore.add(values[i])))
            }
            return { result: ids.length }
        })
    }

    const getIndexes = async () => {
        return await takeRequestAction<IDBIndexInfo[]>("readonly", (transaction: IDBTransaction) => {
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

    const values = async () => {
        return await takeRequestAction<T[]>("readwrite", (transaction: IDBTransaction) => {
            const objectStore = transaction.objectStore(store)
            return objectStore.getAll()
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
        //
        getIndexes,
        values
    } as LDBCollection<T>
}