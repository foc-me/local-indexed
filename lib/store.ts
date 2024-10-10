import { getDatabase, type IDBDatabaseCloser } from "./database"

export async function getStores(databaseName: string) {
    const [database, close] = await getDatabase(databaseName)
    close()
    return [...database.objectStoreNames]
}

export async function existsStore(databaseName: string, storeName: string) {
    const stores = await getStores(databaseName)
    return stores.includes(storeName)
}

export type LDBTransactionCallback = () => void
export type LDBTransactionContext = [IDBTransaction, IDBDatabaseCloser]

async function getTransaction(databaseName: string, storeNames: string | Iterable<string>, mode?: IDBTransactionMode) {
    const [database, close] = await getDatabase(databaseName)
    const transaction = database.transaction(storeNames, mode || "readonly")
    return [transaction, close] as LDBTransactionContext
}

export type LDBStoreContext = [IDBObjectStore, IDBDatabaseCloser]

async function getStore(databaseName: string, storeName: string, mode?: IDBTransactionMode) {
    const [transaction, close] = await getTransaction(databaseName, storeName, mode || "readonly")
    const store = transaction.objectStore(storeName)
    return [store, close] as LDBStoreContext
}

export function setStoreItem(databaseName: string, storeName: string, value: object | object[]): Promise<void> {
    return new Promise(async (resolve, reject) => {
        const [transaction, close] = await getTransaction(databaseName, storeName, "readwrite")
        const store = transaction.objectStore(storeName)

        const values = Array.isArray(value) ? value : [value]
        for (const item of values) {
            store.put(item)
        }

        transaction.addEventListener("complete", () => {
            close()
            resolve()
        })
        transaction.addEventListener("error", error => {
            close()
            reject(error)
        })
    })
}

export function getStoreItem<T extends object>(databaseName: string, storeName: string, keyValue: any): Promise<T | null> {
    return new Promise(async (resolve, reject) => {
        const [store, close] = await getStore(databaseName, storeName)
        const request = store.get(keyValue)
        request.addEventListener("success", () => {
            close()
            resolve(request.result)
        })
        request.addEventListener("error", error => {
            close()
            reject(error)
        })
    })
}

export function deleteStoreItem(databaseName: string, storeName: string, keyValue: any): Promise<void> {
    return new Promise(async (resolve, reject) => {
        const [store, close] = await getStore(databaseName, storeName, "readwrite")
        const request = store.delete(keyValue)

        request.addEventListener("success", () => {
            close()
            resolve()
        })
        request.addEventListener("error", error => {
            close()
            reject(error)
        })
    })
}