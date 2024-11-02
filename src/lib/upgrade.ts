import { isAsyncFunction } from "../util"
import { getIndexedDB } from "./indexed"

/**
 * upgrade database to the specified version
 * 
 * only works with specified version lower than current database version
 * 
 * @param name database name
 * @param version database version
 * @param upgrade upgrade callback
 * @param indexedDB indexedDB factory engine
 * @returns Promise<void>
 */
export function upgradeDatabase(
    database: string,
    version: number,
    upgrade: (context: IDBDatabase) => void,
    indexedDB?: IDBFactory
): Promise<void> {
    return new Promise(async (resolve, reject) => {
        try {
            const indexed = getIndexedDB(indexedDB)
            const request = indexed.open(database, version)
            request.addEventListener("success", () => {
                request.result.close()
                resolve()
            })
            request.addEventListener("error", error => {
                reject(error)
            })
            request.addEventListener("upgradeneeded", () => {
                try {
                    if (typeof upgrade === "function") {
                        if (isAsyncFunction(upgrade)) {
                            console.warn("upgrade callback should not be asynchronous")
                        }
                        upgrade(request.result)
                    }
                } catch (error) {
                    reject(error)
                }
            })
        } catch (error) {
            reject(error)
        }
    })
}