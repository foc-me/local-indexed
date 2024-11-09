import { isAsyncFunction } from "../util"
import { upgradeDatabase, type IDBUpgradeEvent } from "../lib/upgrade"
import { makeContext, type LDBContext } from "./context"
import { collection, type LDBCollection } from "./collection"

export interface LDBUpgradeContext {
    oldVersion: number
    newVersion: number
    collection<T extends object>(store: string): LDBCollection<T>
}

function makeUpgradeContext(event: IDBUpgradeEvent, context: LDBContext) {
    const { transaction, oldVersion, newVersion } = event
    const { database, indexedDB } = context
    const collectionContext = makeContext(database, indexedDB, transaction)

    return {
        oldVersion,
        newVersion,
        collection: <T extends object>(store: string) => {
            return collection<T>(store, collectionContext)
        }
    } as LDBUpgradeContext
}

export async function upgrade(
    version: number,
    callback: (context: LDBUpgradeContext) => void | Promise<void>,
    context: LDBContext
) {
    const { database } = context
    const event = await upgradeDatabase(database, version)
    try {
        const upgradeContext = makeUpgradeContext(event, context)
        if (isAsyncFunction(callback)) {
            await callback(upgradeContext)
        } else {
            callback(upgradeContext)
        }
    } finally {
        event.transaction.db.close()
    }
}