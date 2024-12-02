import { upgradeAction } from "../lib/upgrade"
import { type LDBContext } from "./context"

/**
 * upgrade context
 */
export interface LDBUpgradeEvent {
    oldVersion: number
    newVersion: number | null
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
    callback: (event: LDBUpgradeEvent) => void,
    context: LDBContext
) {
    const { database } = context
    await upgradeAction(database, version, (event) => {
        const { transaction, oldVersion, newVersion } = event
        context.transaction = transaction
        return callback({ oldVersion, newVersion })
    }, false, context.indexedDB).finally(() => {
        context.transaction = undefined
    })
}