import { getDatabases, existsDatabase, deleteDatabase } from "lib/indexed"
import { getDatabase, getVersion } from "lib/database"
import { storage, type LDBStorage } from "./storage"

interface LDBIndexed {
    name: string,
    version: () => Promise<number>
    stores: () => Promise<string[]>
    exists: (store: string) => Promise<boolean>
    storage: (name: string) => LDBStorage
}

async function stores(name: string) {
    const [database, close] = await getDatabase(name)
    close()
    return [...database.objectStoreNames]
}

async function exists(name: string, store: string) {
    const storeNames = await stores(name)
    return !!storeNames.includes(store)
}

function localIndexed(database: string) {
    return {
        name: database,
        version: () => getVersion(database),
        stores: () => stores(database),
        exists: (store: string) => exists(database, store),
        storage: (store: string) => storage(database, store)
    } as LDBIndexed
}

localIndexed.databases = getDatabases
localIndexed.deleteDatabase = deleteDatabase
localIndexed.exsits = existsDatabase
localIndexed.version = getVersion

export default localIndexed