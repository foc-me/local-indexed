import { getDatabase } from "./lib/database"
import { getDatabases, deleteDatabase, useIndexedDB } from "./lib/indexed"
import { type LDBCollection, collection } from "./collection"
import { type LDBContext, makeContext } from "./context"
import { transaction } from "./transaction"
import { type LDBUpgradeEvent, upgrade } from "./upgrade"

interface LDBIndexed {
    name: string,
    version(): Promise<number>
    upgrade(callback: (event: LDBUpgradeEvent) => void | Promise<void>): Promise<void>
    upgrade(version: number, callback: (event: LDBUpgradeEvent) => void | Promise<void>): Promise<void>
    stores(): Promise<string[]>
    collection<T extends object>(store: string): LDBCollection<T>
    transaction(callback: () => void | Promise<void>): Promise<void>
    abort(): void
    close(): void
}

/**
 * get database info
 * 
 * @param database database name
 * @returns database info
 */
async function getDatabaseInfo(database: string) {
    const databases = await getDatabases()
    return databases.find(item => item.name === database)
}

/**
 * get database version
 * 
 * @param database database name
 * @returns database version
 */
async function getVersion(database: string) {
    const target = await getDatabaseInfo(database)
    return target && target.version ? target.version : 0
}

/**
 * get store names from database
 * 
 * @param database database name
 * @returns store names
 */
async function stores(database: string) {
    const db = await getDatabase(database)
    db.close()
    return [...db.objectStoreNames]
}

/**
 * upgrade wrapper use to format upgrade parameters
 * 
 * @param context database context
 * @param version upgrade version or upgrade callback
 * @param callback upgrade callback
 * @returns void or primise void
 */
async function upgradeWrapper(
    context: LDBContext,
    version: number | ((event: LDBUpgradeEvent) => void | Promise<void>),
    callback?: (event: LDBUpgradeEvent) => void | Promise<void>
) {
    if (typeof version === "function") {
        callback = version
        version = await getVersion(context.database) + 1
    }
    if (typeof callback !== "function") {
        throw new ReferenceError("callback is not a function")
    }
    return upgrade(context, version, callback)
}

/**
 * get indexed
 * 
 * @param database database name
 * @param indexedDB indexedDB factory
 * @returns indexed
 */
function localIndexed(database: string, indexedDB?: IDBFactory) {
    const context = makeContext(database, indexedDB)
    return {
        name: database,
        version: () => getVersion(database),
        upgrade: (version, callback) => upgradeWrapper(context, version, callback),
        stores: () => stores(database),
        collection: (store) => collection(context, store),
        transaction: (callback) => transaction(context, callback),
        abort: () => { context.abort() },
        close: () => { context.setTransaction() }
    } as LDBIndexed
}

/**
 * check database exists
 * 
 * @param database database name
 * @returns true if database exists
 */
async function existsDatabase(database: string) {
    return !!(await getDatabaseInfo(database))
}

localIndexed.databases = getDatabases
localIndexed.delete = deleteDatabase
localIndexed.exists = existsDatabase
localIndexed.version = getVersion
localIndexed.use = useIndexedDB

export default localIndexed