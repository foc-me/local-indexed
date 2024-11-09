import { getTransaction } from "./transaction"

/**
 * open cursor option
 */
type IDBCursorOption = {
    query?: IDBValidKey | IDBKeyRange
    direction?: IDBCursorDirection
}

/**
 * open cursor and travers the data
 * 
 * return a collection of data which the callback function returns true
 * 
 * @param target objectStore or index could open cursor
 * @param callback cursor callback
 * @param option open cursor option
 * @returns collection of data
 */
function cursorAction<T>(
    target: IDBObjectStore | IDBIndex,
    callback: (target: T) => boolean | void,
    option?: IDBCursorOption
) {
    return new Promise<T[]>((resolve, reject) => {
        try {
            const result: T[] = []
            const { query, direction } = option || {}
            const request = target.openCursor(query, direction)
            request.addEventListener("success", () => {
                try {
                    if (!request.result) {
                        resolve(result)
                        return
                    }
                    if (callback(request.result.value as T) === true) {
                        result.push(request.result.value)
                    }
                    request.result.continue()
                } catch (error) {
                    reject(error)
                }
            })
            request.addEventListener("error", error => {
                reject(error)
            })
        } catch (error) {
            reject(error)
        }
    })
}

/**
 * open cursor from a IDBObjectStore
 * 
 * return a collection of data which the callback function returns true
 * 
 * @param database database name
 * @param store store name
 * @param callback cursor callback
 * @param option open cursor option
 * @param mode transaction mode
 * @param indexedDB indexedDB factory
 * @returns collection of data
 */
export async function storeCursorAction<T>(
    database: string,
    store: string,
    callback: (target: T) => boolean | void,
    option?: IDBCursorOption,
    mode?: IDBTransactionMode,
    options?: IDBTransactionOptions,
    indexedDB?: IDBFactory
) {
    const transaction = await getTransaction(database, store, mode, options, indexedDB)
    try {
        const objectStore = transaction.objectStore(store)
        return await cursorAction(objectStore, callback, option)
    } catch (error) {
        throw error
    } finally {
        transaction.db.close()
    }
}

/**
 * open cursor from a IDBIndex
 * 
 * return a collection of data which the callback function returns true
 * 
 * @param database database name
 * @param store store name
 * @param index index name
 * @param callback cursor callback
 * @param option open cursor option
 * @param mode transaction mode
 * @param indexedDB indexedDB factory
 * @returns collection of data
 */
export async function indexCursorAction<T>(
    database: string,
    store: string,
    index: string,
    callback: (target: T) => boolean | void,
    option?: IDBCursorOption,
    mode?: IDBTransactionMode,
    options?: IDBTransactionOptions,
    indexedDB?: IDBFactory
) {
    const transaction = await getTransaction(database, store, mode, options, indexedDB)
    try {
        const objectStore = transaction.objectStore(store)
        const storeIndex = objectStore.index(index)
        return await cursorAction(storeIndex, callback, option)
    } catch (error) {
        throw error
    } finally {
        transaction.db.close()
    }
}