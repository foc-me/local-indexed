import { getDatabases, deleteDatabase, useIndexedDB } from "../lib/indexed"
import { getDatabase } from "../lib/database"
import { storage, type LDBStorage } from "./storage"
import { upgrade, type LDBUpgradeContext } from "./upgrade"
import { collection, type LDBCollection } from "./collection"

interface LDBIndexed {
    name: string,
    version(): Promise<number>
    upgrade(version: number, callback: (context: LDBUpgradeContext) => void | Promise<void>): Promise<void>
    stores(): Promise<string[]>
    exists(store: string): Promise<boolean>
    storage(name: string): LDBStorage
    collection: <T>(store: string) => LDBCollection<T>
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

function localIndexed(database: string) {
    return {
        name: database,
        version: () => getVersion(database),
        upgrade: async (version, callback) => {
            await upgrade(database, version, callback)
        },
        stores: () => stores(database),
        exists: (store) => exists(database, store),
        storage: (store) => storage(database, store),
        collection: (store) => collection(database, store)
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