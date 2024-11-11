import { getDatabases, deleteDatabase, useIndexedDB } from "../lib/indexed"
import { getDatabase } from "../lib/database"
import { makeContext } from "./context"
import { storage, type LDBStorage } from "./storage"
import { upgrade, type LDBUpgradeContext } from "./upgrade"
import { collection, type LDBCollection } from "./collection"

/**
 * local indexed database
 */
interface LDBIndexed {
    /**
     * database name
     */
    name: string,
    /**
     * database version
     */
    version(): Promise<number>
    /**
     * upgrade database
     * 
     * @param version upgrade version
     * @param action upgrade action
     */
    upgrade(version: number, action: (context: LDBUpgradeContext) => void | Promise<void>): Promise<void>
    /**
     * return object stores of current database
     */
    stores(): Promise<string[]>
    /**
     * check store exists or not in database
     * 
     * @param store store name
     */
    exists(store: string): Promise<boolean>
    /**
     * get object store storage
     * 
     * just like localStorage
     * 
     * @param name store name
     */
    storage(store: string): LDBStorage
    /**
     * get store colleaction
     * 
     * @param store store name
     * @returns collection
     */
    collection: <T extends object>(store: string) => LDBCollection<T>
}

async function getDatabaseInfo(database: string) {
    const databases = await getDatabases()
    return databases.find(item => item.name === database)
}

async function getVersion(database: string) {
    const target = await getDatabaseInfo(database)
    return target ? target.version : 0
}

async function stores(database: string) {
    const db = await getDatabase(database)
    db.close()
    return [...db.objectStoreNames]
}

async function exists(name: string, store: string) {
    const storeNames = await stores(name)
    return !!storeNames.includes(store)
}

function localIndexed(database: string, indexedDB?: IDBFactory) {
    const context = makeContext(database, indexedDB)

    return {
        name: database,
        version: () => getVersion(database),
        upgrade: async (version, action) => {
            await upgrade(version, action, context)
        },
        stores: () => stores(database),
        exists: (store) => exists(database, store),
        storage: (store) => storage(store, context),
        collection: (store) => collection(store, context)
    } as LDBIndexed
}

async function existsDatabase(database: string) {
    return !!(await getDatabaseInfo(database))
}

localIndexed.databases = getDatabases
localIndexed.deleteDatabase = deleteDatabase
localIndexed.exists = existsDatabase
localIndexed.version = getVersion
localIndexed.useIndexedDB = useIndexedDB

export default localIndexed