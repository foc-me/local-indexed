import { getDatabases, existsDatabase, deleteDatabase } from "lib/indexed"
import { getDatabase, getDatabaseVersion } from "lib/database"
import { storage, type LDBStorage } from "./storage"

interface LDBIndexed {
    name: string,
    version: () => Promise<number>
    stores: () => Promise<string[]>
    exists: (store: string) => Promise<boolean>
    checkout: (version: number) => LDBIndexed
    storage: (name: string) => LDBStorage
}

async function stores(name: string, version: number) {
    const [database, close] = await getDatabase(name, version)
    close()
    return [...database.objectStoreNames]
}

async function exists(name: string, version: number, store: string) {
    const storeNames = await stores(name, version)
    return !!storeNames.includes(store)
}

function localIndexed(database: string, version: number) {
    return {
        name: database,
        version: () => getDatabaseVersion(database),
        stores: () => stores(database, version),
        exists: (store: string) => exists(database, version, store),
        checkout: (version: number) => localIndexed(database, version),
        storage: (store: string) => storage(database, version, store)
    } as LDBIndexed
}

localIndexed.databases = getDatabases
localIndexed.deleteDatabase = deleteDatabase
localIndexed.exsits = existsDatabase
localIndexed.version = getDatabaseVersion

export default localIndexed