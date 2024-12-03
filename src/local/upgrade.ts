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
    context: LDBContext,
    version: number,
    callback: (event: LDBUpgradeEvent) => void | Promise<void>
) {
    console.log(version, callback)
    await upgradeAction(context.database, version, (event) => {
        const { transaction, oldVersion, newVersion } = event
        context.setTransaction(transaction)
        return callback({ oldVersion, newVersion })
    }, false, context.indexedDB).finally(() => {
        context.setTransaction()
    })
}