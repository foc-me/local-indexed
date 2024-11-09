import { isAsyncFunction } from "../util"
import { upgradeDatabase } from "../lib/upgrade"
import { collection, type LDBCollection } from "./collection"

export interface LDBUpgradeContext {
    oldVersion: number
    newVersion: number
    collection<T>(store: string): LDBCollection<T>
}

function makeContext(event: IDBVersionChangeEvent) {
    const { target, oldVersion, newVersion } = event
    const { transaction } = (target || {}) as IDBOpenDBRequest

    if (!transaction) {
        throw new ReferenceError("upgrade transaction is not defined")
    }
    const database = transaction.db.name

    return {
        oldVersion,
        newVersion,
        collection: <T>(store: string) => collection<T>(database, store, transaction)
    } as LDBUpgradeContext
}

export async function upgrade(database: string, version: number, callback: (context: LDBUpgradeContext) => void | Promise<void>) {
    return await upgradeDatabase(database, version, async (db, event) => {
        if (isAsyncFunction(callback)) {
            await callback(makeContext(event))
        } else callback(makeContext(event))
    })
}