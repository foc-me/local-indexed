import { getDatabases, deleteDatabase, useIndexedDB } from "./lib/indexed"
import { stores } from "./store/stores"
import { type LDBCollection, collection } from "./collection"
import { type LDBContext, makeContext } from "./context"
import { transaction } from "./transaction"
import { type LDBUpgradeEvent, upgrade } from "./upgrade"

/**
 * indexed
 */
interface LDBIndexed {
    /**
     * database name
     */
    name: string,
    /**
     * get database version
     */
    version(): Promise<number>
    /**
     * get database store names
     */
    stores(): Promise<string[]>
    /**
     * upgrade database
     * 
     * @param callback upgrade callback
     */
    upgrade(callback?: (event: LDBUpgradeEvent) => void | Promise<void>): Promise<void>
    /**
     * upgrade database to specified version
     * 
     * @param version upgrade version
     * @param callback upgrade callback
     */
    upgrade(version: number, callback?: (event: LDBUpgradeEvent) => void | Promise<void>): Promise<void>
    /**
     * create store collection
     * @param store store name
     */
    collection<T extends object>(store: string): LDBCollection<T>
    /**
     * create transaction action
     * @param callback transaction callback
     */
    transaction(callback?: () => void | Promise<void>): Promise<void>
    /**
     * abort global transaction
     */
    abort(): void
    /**
     * abort global transaction and close database connection
     */
    close(): void
}

/**
 * get database info
 * 
 * @param database database name
 * @param indexedDB indexedDB factory
 * @returns database info
 */
async function getDatabaseInfo(database: string, indexedDB?: IDBFactory) {
    const databases = await getDatabases(indexedDB)
    return databases.find(item => item.name === database)
}

/**
 * get database version
 * 
 * @param database database name
 * @param indexedDB indexedDB factory
 * @returns database version
 */
async function getVersion(database: string, indexedDB?: IDBFactory) {
    const target = await getDatabaseInfo(database, indexedDB)
    return target && target.version ? target.version : 0
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
    version?: number | ((event: LDBUpgradeEvent) => void | Promise<void>),
    callback?: (event: LDBUpgradeEvent) => void | Promise<void>
) {
    if (typeof version === "function") {
        callback = version
    }
    if (typeof version !== "number") {
        version = await getVersion(context.database, context.indexedDB) + 1
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
        version: () => getVersion(database, indexedDB),
        stores: () => stores(database, indexedDB),
        upgrade: (version, callback) => upgradeWrapper(context, version, callback),
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
 * @param indexedDB indexedDB factory
 * @returns true if database exists
 */
async function existsDatabase(database: string, indexedDB?: IDBFactory) {
    return !!(await getDatabaseInfo(database, indexedDB))
}

/**
 * get databases
 */
localIndexed.databases = getDatabases
/**
 * delete database
 */
localIndexed.delete = deleteDatabase
/**
 * database exists
 */
localIndexed.exists = existsDatabase
/**
 * get specified database version
 */
localIndexed.version = getVersion
/**
 * use indexeddb factory
 */
localIndexed.use = useIndexedDB

export default localIndexed