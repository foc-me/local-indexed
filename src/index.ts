export { useIndexedDB } from "lib/indexed"
import { getDatabases, existsDatabase, deleteDatabase } from "lib/indexed"
import { getDatabaseVersion } from "lib/database"
import { store, type LDBStore } from "./store"
import { collection, type LDBCollection } from "./collection"

interface LDBIndexed {
    name: string,
    version: () => Promise<number>
    transaction: (names: string | Iterable<string>) => unknown
    upgrade: (version: number) => unknown,
    store: (name: string) => LDBStore,
    collection: (name: string) => LDBCollection
}

function localIndexed(database: string) {

    return {
        name: database,
        version: () => getDatabaseVersion(database),
        store: (name: string) => store(database, name),
        collection: (name: string) => collection(database, name)
    } as LDBIndexed
}

localIndexed.databases = getDatabases
localIndexed.exsits = existsDatabase
localIndexed.deleteDatabase = deleteDatabase

export default localIndexed