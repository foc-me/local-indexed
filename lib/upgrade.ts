import { getIndexedDB } from "./indexed"

export type IDBIndexOptionRecord = Record<string, { keyPath?: string | string[] } & IDBIndexParameters>
export type IDBIndexOptionArray = Array<[string, (string | string[])?, IDBIndexParameters?]>

/**
 * database store index construct
 * 
 * could be record or array like
 * 
 * @example
 * ```ts
 * {
 *      indexName1: { keyName?, unique?, multiEntry? },
 *      indexName2: { keyName?, unique?, multiEntry? }
 * }
 * ```
 * 
 * @example
 * ```ts
 * [
 *      [indexName1, keyName1?, { unique?, multiEntry? }?],
 *      [indexName2, keyName2?, { unique?, multiEntry? }?]
 * ]
 * ```
 */
export type IDBIndexOption = IDBIndexOptionRecord | IDBIndexOptionArray

/**
 * database store construct
 * 
 * index could be record or array
 * 
 * @example
 * ```ts
 * {
 *      autoIncrement?,
 *      keyPath?,
 *      index: {
 *          indexName1: { keyName?, unique?, multiEntry? },
 *          indexName2: { keyName?, unique?, multiEntry? }
 *      }
 * }
 * ```
 * 
 * @example
 * ```ts
 * {
 *      autoIncrement?,
 *      keyPath?,
 *      index: [
 *          [indexName1, keyName1?, { unique?, multiEntry? }],
 *          [indexName2, keyName2?, { unique?, multiEntry? }]
 *      ]
 * }
 * ```
 */
export interface IDBStoreOption {
    autoIncrement?: boolean
    keyPath?: string | string[] | null
    index?: IDBIndexOption
}

/**
 * format store index
 * 
 * turn LDBIndexOption to LDBIndexOptionArray
 * 
 * @param option store index construt
 * @returns LDBIndexOptionArray
 */
function formatStoreIndex(option: IDBIndexOption): IDBIndexOptionArray {
    if (Array.isArray(option)) {
        return option.map(item => {
            const [indexName, keyName, option] = item
            return [indexName, keyName || indexName, option]
        })
    }

    return Object.entries(option).map(item => {
        const [indexName, { keyPath, unique, multiEntry }] = item
        return [indexName, keyPath || indexName, { unique, multiEntry }]
    })
}

/**
 * create database store and put initial values
 * 
 * @param database database
 * @param name store name
 * @param option store construct
 * @param values initial values
 */
function createStore(database: IDBDatabase, name: string, option: IDBStoreOption, values?: unknown[]) {
    const { keyPath, autoIncrement, index } = option
    const store = database.createObjectStore(name, { keyPath, autoIncrement })

    if (index) {
        const indexes = formatStoreIndex(index).filter(item => {
            return !!item[0] && !!item[1]
        })
        if (indexes.length > 0) {
            for (const params of indexes) {
                const [indexName, keyPath, option] = params
                store.createIndex(indexName, keyPath || indexName, option)
            }
        }
    }

    if (Array.isArray(values) && values.length > 0) {
        for (const item of values) {
            store.put(item)
        }
    }
}

/**
 * delete store from database
 * 
 * @param database database
 * @param name store name
 */
function deleteStore(database: IDBDatabase, name: string) {
    database.deleteObjectStore(name)
}

/**
 * the context in database upgrade callback
 * to create or delete store from database
 */
interface IDBUpgradeContext {
    createStore: (name: string, option: IDBStoreOption, values?: unknown[]) => void
    deleteStore: (name: string) => void
}

/**
 * create a context object for upgrade callback
 * 
 * @param database database
 * @returns upgrade callback context
 */
function createUpgradeContext(database: IDBDatabase): IDBUpgradeContext {
    return {
        createStore: (name: string, option: IDBStoreOption, values?: unknown[]) => {
            createStore(database, name, option, values)
        },
        deleteStore: (name: string) => {
            deleteStore(database, name)
        }
    }
}

/**
 * database upgrade callback
 */
export type LDBUpgradeCallback = (context: IDBUpgradeContext) => void

/**
 * upgrade database to the specified version
 * 
 * only works with specified version lower than current database version
 * 
 * @param name database name
 * @param version database version
 * @param upgrade upgrade callback
 * @returns Promise<void>
 */
export function upgradeDatabase(name: string, version: number, upgrade: LDBUpgradeCallback): Promise<void> {
    return new Promise(async (resolve, reject) => {
        const indexed = getIndexedDB()
        const request = indexed.open(name, version)
        request.addEventListener("success", () => {
            const { result } = request
            result.close()
            resolve()
        })
        request.addEventListener("error", error => {
            reject(error)
        })
        request.addEventListener("upgradeneeded", () => {
            if (typeof upgrade === "function") {
                const { result } = request
                upgrade(createUpgradeContext(result))
            }
        })
    })
}