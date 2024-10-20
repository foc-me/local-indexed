/**
 * the current global indexeddb
 */
const globalIndexedDB: { current?: IDBFactory } = { current: undefined }

/**
 * specify indexedDB engine instead of use globalThis.indexedDB
 * 
 * @param indexedDB indexedDB factory engine
 */
export function useIndexedDB(indexedDB: IDBFactory) {
    globalIndexedDB.current = indexedDB
}

/**
 * get global indexedDB engine
 * 
 * return param indexedDB if exists
 * 
 * @param indexedDB indexedDB factory engine
 * @returns indexedDB factory engine
 */
export function getIndexedDB(indexedDB?: IDBFactory) {
    if (indexedDB) return indexedDB
    if (globalIndexedDB.current) return globalIndexedDB.current
    if (!globalThis || !globalThis.indexedDB) {
        throw new ReferenceError("indexedDB is not defined")
    }
    return globalThis.indexedDB
}

/**
 * get database infos
 * 
 * @param indexedDB indexedDB factory engine
 * @returns promise databases info
 */
export function getDatabases(indexedDB?: IDBFactory) {
    const indexed = getIndexedDB(indexedDB)
    return indexed.databases()
}

/**
 * exist of the specified database
 * 
 * @param database database name
 * @param indexedDB indexedDB factory engine
 * @returns Promise<boolean>
 */
export async function existsDatabase(database: string, indexedDB?: IDBFactory) {
    const databases = await getDatabases(indexedDB)
    return !!databases.find(item => item.name === database)
}

/**
 * delete specified database
 * 
 * @param name database name
 * @param indexedDB indexedDB factory engine
 * @returns Promise<boolean>
 */
export function deleteDatabase(database: string, indexedDB?: IDBFactory): Promise<boolean> {
    return new Promise((resolve, reject) => {
        try {
            const indexed = getIndexedDB(indexedDB)
            const request = indexed.deleteDatabase(database)
            request.addEventListener("success", () => {
                resolve(true)
            })
            request.addEventListener("error", error => {
                reject(error)
            })
            request.addEventListener("abort", () => {
                reject(new Error("database is using"))
            })
        } catch (error) {
            reject(error)
        }
    })
}