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
    upgrade: (context: IDBDatabase, event: IDBVersionChangeEvent) => void | Promise<void>,
    indexedDB?: IDBFactory
): Promise<void> {
    return new Promise(async (resolve, reject) => {
        // the upgrade callback is not running in transaction
        // should be quite clear and considered while in upgrading data or database
        // it can't rollback after any error throw out
        try {
            const indexed = getIndexedDB(indexedDB)
            const request = indexed.open(database, version)
            // request.addEventListener("success", () => {
            //     request.result.close()
            //     resolve()
            // })
            request.addEventListener("error", error => {
                reject(error)
            })
            request.addEventListener("upgradeneeded", async (event) => {
                try {
                    if (isAsyncFunction(upgrade)) {
                        await upgrade(request.result, event)
                    } else upgrade(request.result, event)
                    request.result.close()
                    resolve()
                } catch (error) {
                    reject(error)
                }
            })
        } catch (error) {
            reject(error)
        }
    })
}