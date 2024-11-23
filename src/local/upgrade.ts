import { type IDBUpgradeEvent, upgradeAction } from "../lib/upgrade"
import { type LDBContext, makeContext } from "./context"
import { type LDBCollection, collection } from "./collection"

/**
 * upgrade context
 */
export interface LDBUpgradeContext {
    oldVersion: number
    newVersion: number
    collection<T extends object>(store: string): LDBCollection<T>
    abort(): void
}

/**
 * make upgrade context
 * 
 * @param event upgradeneeded event
 * @param context database context
 * @returns upgrade content
 */
function makeUpgradeContext(event: IDBUpgradeEvent, context: LDBContext) {
    const { transaction, oldVersion, newVersion } = event
    const { database, indexedDB } = context
    const collectionContext = makeContext(database, indexedDB, transaction)

    return {
        oldVersion,
        newVersion,
        collection: <T extends object>(store: string) => {
            return collection<T>(store, collectionContext)
        },
        abort: () => { transaction.abort() }
    } as LDBUpgradeContext
}

/**
 * indexed upgrade
 * 
 * @param version upgrade version
 * @param callback upgrade callback
 * @param context database context
 */
export async function upgrade(
    version: number,
    callback: (context: LDBUpgradeContext) => void,
    context: LDBContext
) {
    const { database } = context
    await upgradeAction(database, version, (event) => {
        return callback(makeUpgradeContext(event, context))
    })
}