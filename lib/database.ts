import { getIndexedDB } from "./indexed"

/**
 * close database
 */
export interface IDBDatabaseCloser {
    (): void
}

/**
 * get the specified database
 * 
 * @param name database name
 * @param version database version
 * @returns promise database and close function
 */
export function getDatabase(name: string, version?: number): Promise<[IDBDatabase, IDBDatabaseCloser]> {
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
    const [db, close] = await getDatabase(name)
    close() // close database
    return db.version
}