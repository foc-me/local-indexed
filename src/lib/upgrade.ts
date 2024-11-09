import { getDatabases, getIndexedDB } from "./indexed"

/**
 * resolve value of upgradeDatabase
 */
export type IDBUpgradeEvent = {
    /**
     * upgrade transaction of upgradeneeded callback event
     */
    transaction: IDBTransaction
    /**
     * current version
     */
    oldVersion: number
    /**
     * upgrade version
     */
    newVersion: number | null
    /**
     * the origin event of upgradeneeded callback
     */
    origin: IDBVersionChangeEvent
}

/**
 * resolve upgrade event from upgradeneeded callback
 * 
 * @param database database name
 * @param version upgrade version
 * @param indexedDB indexeddb factory
 * @returns upgrade event
 */
export function upgradeDatabase(database: string, version: number, indexedDB?: IDBFactory) {
    return new Promise<IDBUpgradeEvent>(async (resolve, reject) => {
        try {
            const current = (await getDatabases(indexedDB)).find(item => item.name === database)
            if (current && current.version && current.version >= version) {
                throw new Error(`upgrade version error: version '${current.version}' can not upgrade to version '${version}'`)
            }

            const indexed = getIndexedDB(indexedDB)
            const request = indexed.open(database, version)
            request.addEventListener("error", error => {
                reject(error)
            })
            request.addEventListener("upgradeneeded", event => {
                try {
                    const { target, oldVersion, newVersion } = event
                    const { transaction } = (target || {}) as IDBOpenDBRequest
                    if (transaction) {
                        // just don't use setTimeout or something like it in then function
                        resolve({ transaction, oldVersion, newVersion, origin: event })
                    } else {
                        reject(new Error("version change transaction is not defined"))
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