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
 * database upgrade action
 * 
 * @param database database name
 * @param version upgrade version
 * @param callback action callback
 * @param rollback rollback setting default to true
 * @param indexedDB indexedDB factory
 * @returns promise void
 */
export function upgradeAction(
    database: string,
    version: number,
    callback: (event: IDBUpgradeEvent) => void | Promise<void>,
    rollback: boolean = false,
    indexedDB?: IDBFactory
) {
    return new Promise<void>(async (resolve, reject) => {
        try {
            const current = (await getDatabases(indexedDB)).find(item => item.name === database)
            if (current && current.version && current.version >= version) {
                throw new Error(`can not upgrade version from '${current.version}' to '${version}'`)
            }

            const indexed = getIndexedDB(indexedDB)
            const request = indexed.open(database, version)
            const close = () => {
                if (request.result) request.result.close()
            }
            request.addEventListener("upgradeneeded", async event => {
                const { target, oldVersion, newVersion } = event
                const { transaction } = (target || {}) as IDBOpenDBRequest
                if (transaction) {
                    try {
                        const call = callback({ transaction, oldVersion, newVersion, origin: event })
                        if (call instanceof Promise) await call
                        resolve()
                    } catch (error) {
                        if (rollback === true) transaction.abort()
                        reject(error)
                    } finally {
                        close()
                    }
                } else {
                    close()
                    reject(new Error("version change transaction is not defined"))
                }
            })
            request.addEventListener("error", error => {
                close()
                reject(error)
            })
        } catch (error) {
            reject(error)
        }
    })
}