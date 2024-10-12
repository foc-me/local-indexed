import { getIndexedDB } from "./indexed"

/**
 * close database
 */
export type IDBDatabaseCloser = () => void
/**
 * database context
 */
export type IDBDatabaseContext = [IDBDatabase, IDBDatabaseCloser]

/**
 * get the specified database
 * 
 * @param name database name
 * @param version database version
 * @returns promise database and close function
 */
export function getDatabase(name: string, version?: number): Promise<IDBDatabaseContext> {
    return new Promise((resolve, reject) => {
        const indexed = getIndexedDB()
        const request = indexed.open(name, version)
        request.addEventListener("success", () => {
            const { result } = request
            // always close database after any action
            resolve([result, () => { result.close() }])
        })
        request.addEventListener("error", error => {
            reject(error)
        })
    })
}

/**
 * get version of the specified database
 * 
 * @param name database name
 * @returns promise version
 */
export async function getDatabaseVersion(name: string) {
    const [database, close] = await getDatabase(name)
    close()
    return database.version
}

/**
 * get database store names
 * 
 * @param name database name
 * @returns store names
 */
export async function getDatabaseStoreNames(name: string) {
    const [database, close] = await getDatabase(name)
    close()
    return [...database.objectStoreNames]
}