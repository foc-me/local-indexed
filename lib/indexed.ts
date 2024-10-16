/**
 * the current global indexeddb
 */
const globalIndexedDB: { current?: IDBFactory } = { current: undefined }

/**
 * specify indexedDB engine instead of use globalThis.indexedDB
 * 
 * @param indexedDB target indexedDB engine
 */
export function useIndexedDB(indexedDB: IDBFactory) {
    globalIndexedDB.current = indexedDB
}

/**
 * get global indexedDB engine
 * 
 * @returns indexeddb
 */
export function getIndexedDB() {
    if (globalIndexedDB.current) return globalIndexedDB.current
    if (!globalThis || !globalThis.indexedDB) {
        throw new ReferenceError("indexedDB is not defined")
    }
    return globalThis.indexedDB
}

/**
 * get database infos
 * 
 * @returns promise databases info
 */
export function getDatabases() {
    const indexed = getIndexedDB()
    return indexed.databases()
}

/**
 * exist of the specified database
 * 
 * @param name database name
 * @returns Promise<boolean>
 */
export async function existsDatabase(name: string) {
    const databases = await getDatabases()
    return !!databases.find(item => item.name === name)
}

/**
 * delete specified database
 * 
 * @param name database name
 * @returns Promise<boolean>
 */
export function deleteDatabase(name: string): Promise<boolean> {
    return new Promise((resolve, reject) => {
        const indexed = getIndexedDB()
        const request = indexed.deleteDatabase(name)
        request.addEventListener("success", () => {
            resolve(true)
        })
        request.addEventListener("error", error => {
            reject(error)
        })
        request.addEventListener("abort", () => {
            reject(new Error("database is using"))
        })
    })
}