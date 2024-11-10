import { getIndexedDB } from "./indexed"

/**
 * get the specified database
 * 
 * @param database database or database name
 * @param version database version
 * @param indexedDB indexedDB factory engine
 * @returns promise database and close function
 */
export function getDatabase(database: string, indexedDB?: IDBFactory): Promise<IDBDatabase> {
    return new Promise((resolve, reject) => {
        try {
            const indexed = getIndexedDB(indexedDB)
            const request = indexed.open(database)
            request.addEventListener("success", () => {
                resolve(request.result)
            })
            request.addEventListener("error", error => {
                reject(error)
            })
        } catch (error) {
            reject(error)
        }
    })
}