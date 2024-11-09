import { getDatabases, deleteDatabase } from "../indexed"
import { storeAction } from "../store"

export async function deleteDatabases() {
    const databases = await getDatabases()
    for (const database of databases) {
        if (database.name) {
            await deleteDatabase(database.name)
        }
    }
}

async function getDatabaseInfo(database: string, indexedDB?: IDBFactory) {
    const databases = await getDatabases(indexedDB)
    return databases.find(item => item.name === database)
}

export async function existsDatabase(database: string, indexedDB?: IDBFactory) {
    return !!await getDatabaseInfo(database, indexedDB)
}

export async function getVersion(database: string, indexedDB?: IDBFactory) {
    const target = await getDatabaseInfo(database, indexedDB)
    return target ? target.version : 0
}

export async function countStore(
    database: string,
    store: string,
    options?: IDBTransactionOptions,
    indexedDB?: IDBFactory
) {
    return await storeAction<number>(database, store, (objectStore) => {
        return objectStore.count()
    }, "readonly", options, indexedDB)
}

export async function getStoreItem<T extends object>(
    database: string,
    store: string,
    keyValue: IDBValidKey,
    options?: IDBTransactionOptions,
    indexedDB?: IDBFactory
) {
    return await storeAction<T>(database, store, (objectStore) => {
        return objectStore.get(keyValue)
    }, "readonly", options, indexedDB)
}

export async function countStoreItem(
    database: string,
    store: string,
    options?: IDBTransactionOptions,
    indexedDB?: IDBFactory
) {
    return await storeAction<number>(database, store, (objectStore) => {
        return objectStore.count()
    }, "readonly", options, indexedDB)
}