import { getDatabases, existsDatabase, deleteDatabase, useIndexedDB } from "../lib/indexed"
import { getDatabase, getVersion } from "../lib/database"
import { storage, type LDBStorage } from "./storage"
import { upgrade } from "./upgrade"

interface LDBIndexed {
    name: string,
    version: () => Promise<number>
    upgrade: (version: number, callback: () => void) => void
    stores: () => Promise<string[]>
    exists: (store: string) => Promise<boolean>
    storage: (name: string) => LDBStorage
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
        upgrade: (version: number, callback: Function) => upgrade(database, version, callback),
        stores: () => stores(database),
        exists: (store: string) => exists(database, store),
        storage: (store: string) => storage(database, store)
    } as LDBIndexed
}

localIndexed.databases = getDatabases
localIndexed.deleteDatabase = deleteDatabase
localIndexed.exists = existsDatabase
localIndexed.version = getVersion
localIndexed.useIndexedDB = useIndexedDB

export default localIndexed