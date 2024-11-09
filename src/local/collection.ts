import { getTransaction, transactionAction, requestAction } from "../lib/transaction"

type LDBIndexOption = {
    keyPath?: string | Iterable<string>
    unique?: boolean
    multiEntry?: boolean
}

type LDBCollectionOption = {
    keyPath?: string | string[] | null
    autoIncrement?: boolean
    index?: Record<string, LDBIndexOption>
}

type IDBIndexInfo = {
    name: string
    keyPath: string | string[]
    unique: boolean
    multiEntry: boolean
}

export interface LDBCollection<T> {
    // upgrade api
    create(options: LDBCollectionOption): boolean
    drop(): boolean
    alter(options: LDBCollectionOption): boolean
    createIndex(index: string, options: LDBIndexOption): boolean
    dropIndex(index: string): boolean
    // action api
    // select api
    getIndexes(): Promise<IDBIndexInfo[]>
    values(): Promise<T[]>
}

function checkVersionChange(transaction?: IDBTransaction): transaction is IDBTransaction {
    return !!transaction && transaction.mode === "versionchange"
}

function containsStore(transaction: IDBTransaction, store: string) {
    return transaction.objectStoreNames.contains(store)
}

function containsIndex(objectStore: IDBObjectStore, index: string) {
    return objectStore.indexNames.contains(index)
}

function splitCollectionOption(options: LDBCollectionOption) {
    const { keyPath, autoIncrement, index } = options
    return [{ keyPath, autoIncrement }, index] as [IDBObjectStoreParameters, Record<string, LDBIndexOption>]
}

type LDBCreateIndexOptions = [string, (string | string[]), IDBIndexParameters?]

function formatIndexOption(options?: Record<string, LDBIndexOption>) {
    return Object.entries(options || {}).map(([key, option]) => {
        const { keyPath, unique, multiEntry } = option
        return [key, keyPath || key, { unique, multiEntry }] as LDBCreateIndexOptions
    })
}

export function collection<T>(database: string, store: string, transaction?: IDBTransaction) {
    const create = (options: LDBCollectionOption) => {
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
        if (checkVersionChange(transaction)) {
            transaction.db.deleteObjectStore(store)
            return !containsStore(transaction, store)
        }
        throw new Error("only use this api in upgrade callback")
    }

    const alter = (options: LDBCollectionOption) => {
        if (checkVersionChange(transaction)) {
            if (containsStore(transaction, store)) drop()
            return create(options)
        }
        throw new Error("only use this api in upgrade callback")
    }

    const createIndex = (index: string, options: LDBIndexOption) => {
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

    const getIndexes = async () => {
        const makeIndexes = (transaction: IDBTransaction) => {
            const objectStore = transaction.objectStore(store)
            const indexNames = [...objectStore.indexNames]
            const result: IDBIndexInfo[] = []
            for (let i = 0; i < indexNames.length; i++) {
                const { name, keyPath, unique, multiEntry } = objectStore.index(indexNames[i])
                result.push({ name, keyPath, unique, multiEntry })
            }
            return result
        }
        if (transaction) return makeIndexes(transaction)
        else {
            const transaction = await getTransaction(database, store, "readonly")
            return await transactionAction<IDBIndexInfo[]>(transaction, () => {
                const result = makeIndexes(transaction)
                return { result } as IDBRequest
            })
        }
    }

    const values = async () => {
        const makeValus = (transaction: IDBTransaction) => {
            const objectStore = transaction.objectStore(store)
            return objectStore.getAll()
        }
        if (transaction) {
            return await requestAction<T[]>(() => {
                return makeValus(transaction)
            })
        } else {
            const transaction = await getTransaction(database, store, "readonly")
            return await transactionAction<T[]>(transaction, () => {
                return makeValus(transaction)
            })
        }
    }

    return {
        create,
        drop,
        alter,
        createIndex,
        dropIndex,
        getIndexes,
        values
    } as LDBCollection<T>
}