import { getDatabases } from "../indexed"
import { storeAction } from "../store"

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

export async function countStore(database: string, store: string, indexedDB?: IDBFactory) {
    return await storeAction<number>(database, store, "readonly", (objectStore) => {
        return objectStore.count()
    }, indexedDB)
}

export async function getStoreItem<T extends object>(
    database: string,
    store: string,
    keyValue: IDBValidKey,
    indexedDB?: IDBFactory
) {
    return await storeAction<T>(database, store, "readonly", (objectStore) => {
        return objectStore.get(keyValue)
    }, indexedDB)
}