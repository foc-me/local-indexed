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
 * get database info
 * 
 * @param indexedDB indexedDB factory engine
 * @returns promise database info
 */
export async function getDatabases(indexedDB?: IDBFactory) {
    const indexed = getIndexedDB(indexedDB)
    return await indexed.databases()
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
            request.addEventListener("success", async () => {
                const info = await getDatabases()
                resolve(!info.find(item => item === database))
            })
            request.addEventListener("error", error => {
                reject(error)
            })
            request.addEventListener("blocked", () => {
                reject(new Error("delete database blocked: some connections not closed"))
            })
        } catch (error) {
            reject(error)
        }
    })
}